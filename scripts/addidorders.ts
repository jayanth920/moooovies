// scripts/migrateOrderMovieIds.js
import { dbConnect } from "@/app/lib/dbConnect";
import { Order } from "@/app/models/Order";
import { Movie } from "@/app/models/Movie";
import * as dotenv from 'dotenv';
dotenv.config();

async function migrateOrderMovieIds() {
  await dbConnect();
  
  const orders = await Order.find({ "movies.movieSnapshot.id": { $exists: true } });
  
  for (const order of orders) {
    let needsUpdate = false;
    
    for (const movieItem of order.movies) {
      // If we have numeric id but no _id, look up the movie and add _id
      if (movieItem.movieSnapshot.id && !movieItem.movieSnapshot._id) {
        const movie = await Movie.findOne({ id: movieItem.movieSnapshot.id });
        if (movie) {
          movieItem.movieSnapshot._id = movie._id;
          needsUpdate = true;
        }
      }
    }
    
    if (needsUpdate) {
      await order.save();
      console.log(`Updated order: ${order._id}`);
    }
  }
  
  console.log('Migration completed');
}

migrateOrderMovieIds();