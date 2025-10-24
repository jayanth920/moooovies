import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/dbConnect";
import { User } from "@/app/models/User";
import { requireAdmin } from "@/app/lib/auth";

export async function POST(req: Request) {
  try {
    const authResult = requireAdmin(req);
    if (authResult && (authResult as any).error) {
      return (authResult as any).error;
    }

    await dbConnect();
    const { action, userIds, data } = await req.json();
    const currentAdminId = authResult.id;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "No users selected" },
        { status: 400 }
      );
    }

    const results = {
      success: [] as string[],
      failed: [] as { userId: string; error: string }[],
    };

    switch (action) {
      case "change-role":
        if (!data?.role) {
          return NextResponse.json(
            { success: false, error: "Role is required" },
            { status: 400 }
          );
        }
        // Process each user individually for role change
        for (const userId of userIds) {
          try {
            // Prevent admin from changing their own role
            if (userId === currentAdminId) {
              results.failed.push({
                userId,
                error: "Cannot change your own role",
              });
              continue;
            }

            const updatedUser = await User.findByIdAndUpdate(
              userId,
              { role: data.role },
              { new: true }
            ).select("-passwordHash");

            if (!updatedUser) {
              results.failed.push({
                userId,
                error: "User not found",
              });
            } else {
              results.success.push(userId);
            }
          } catch (error) {
            results.failed.push({
              userId,
              error: "Failed to update role",
            });
          }
        }
        break;

      case "change-status":
        if (data?.active === undefined) {
          return NextResponse.json(
            { success: false, error: "Status is required" },
            { status: 400 }
          );
        }
        // Process each user individually for status change
        for (const userId of userIds) {
          try {
            // Prevent admin from deactivating themselves
            if (userId === currentAdminId && data.active === false) {
              results.failed.push({
                userId,
                error: "Cannot deactivate your own account",
              });
              continue;
            }

            // Check if user is admin before deactivation
            const user = await User.findById(userId);
            if (!user) {
              results.failed.push({
                userId,
                error: "User not found",
              });
              continue;
            }

            // Prevent deactivation of admin accounts
            if (user.role === "admin" && data.active === false) {
              results.failed.push({
                userId,
                error: "Cannot deactivate admin accounts",
              });
              continue;
            }

            const updatedUser = await User.findByIdAndUpdate(
              userId,
              { active: data.active },
              { new: true }
            ).select("-passwordHash");

            results.success.push(userId);
          } catch (error) {
            results.failed.push({
              userId,
              error: "Failed to update status",
            });
          }
        }
        break;

      case "delete":
        // Process each user individually for deletion
        for (const userId of userIds) {
          try {
            // Prevent admin from deleting themselves
            if (userId === currentAdminId) {
              results.failed.push({
                userId,
                error: "Cannot delete your own account",
              });
              continue;
            }

            // Check if user exists and is not an admin
            const user = await User.findById(userId);
            if (!user) {
              results.failed.push({
                userId,
                error: "User not found",
              });
              continue;
            }

            // Prevent deletion of admin accounts
            if (user.role === "admin") {
              results.failed.push({
                userId,
                error: "Cannot delete admin accounts",
              });
              continue;
            }

            // Delete the user
            await User.findByIdAndDelete(userId);
            results.success.push(userId);
          } catch (error) {
            results.failed.push({
              userId,
              error: "Failed to delete user",
            });
          }
        }
        break;

      case "export":
        // For export, we'll just return the user data
        const users = await User.find({ _id: { $in: userIds } }).select(
          "-passwordHash"
        );
        return NextResponse.json({
          success: true,
          data: users,
          message: `Exported ${users.length} users`,
        });

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }

    // Get updated users for response (only for non-export actions)
    const updatedUsers =
      action !== "delete" && action !== "export"
        ? await User.find({ _id: { $in: results.success } }).select(
            "-passwordHash"
          )
        : [];

    return NextResponse.json({
      success: true,
      message: `${action} operation completed`,
      results,
      updatedCount: results.success.length,
      failedCount: results.failed.length,
      users: updatedUsers,
    });
  } catch (error) {
    console.error("Error performing bulk action:", error);
    return NextResponse.json(
      { success: false, error: "Failed to perform bulk action" },
      { status: 500 }
    );
  }
}
