
'use client'
import { ArrowRight } from "lucide-react";
import { useRouter } from 'next/navigation'
interface MenuAnimationProps {
  menuItems: string[];
}

export default function MenuAnimation({ menuItems }: MenuAnimationProps) {
  const router = useRouter()

  return (
    <div className="flex min-w-fit flex-row md:flex-col gap-2 md:gap-3 md:overflow-hidden pl-4 sm:px-10 absolute top-[4vh] md:top-[5vh] left-[3vw] md:left-0">
      {menuItems.map((item, index) => (
        <button key={index} onClick={() => router.push(`/${item.toLowerCase().replace(/\s+/g, '-')}`)} className="group flex items-center md:gap-1 gap-2 cursor-pointer min-h-fit">
          <ArrowRight className="size-0 -translate-x-full text-white opacity-0 transition-all duration-300 ease-out hover:z-20 group-hover:translate-x-0 group-hover:text-blue-500 group-hover:opacity-100 md:size-8" />

          <p className="z-10 -translate-x-6 font-mono font-extrabold md:font-semibold text-amber-50 transition-transform duration-300 ease-out group-hover:translate-x-0 group-hover:text-blue-500 md:-translate-x-12 text-[18px] md:text-3xl md:group-hover:translate-x-0 leading-none ">
            {item}
          </p>
        </button>
      ))}
    </div>
  );
}
