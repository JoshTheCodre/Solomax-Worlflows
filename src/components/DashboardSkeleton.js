'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export function DashboardSkeleton() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="space-y-8 w-full" 
      initial="hidden"
      animate="show"
      variants={container}
    >
      {/* Stat Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6"
        variants={item}
      >
        {[...Array(5)].map((_, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <div>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </Card>
        ))}
      </motion.div>
      
      {/* Table Card */}
      <motion.div variants={item}>
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-4 w-32" />
          </div>
          
          <div className="px-6 pt-4">
            <Skeleton className="h-10 w-full mb-4" />
          </div>
          
          <div className="p-6">
            {/* Table Header */}
            <div className="flex mb-4">
              <Skeleton className="h-8 flex-1 mr-2" />
              <Skeleton className="h-8 w-20 mr-2" />
              <Skeleton className="h-8 w-20 mr-2" />
              <Skeleton className="h-8 w-20 mr-2" />
              <Skeleton className="h-8 w-24 mr-2" />
              <Skeleton className="h-8 w-24" />
            </div>
            
            {/* Table Rows */}
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex mb-6 py-2">
                <Skeleton className="h-16 flex-1 mr-2" />
                <Skeleton className="h-16 w-20 mr-2" />
                <Skeleton className="h-16 w-20 mr-2" />
                <Skeleton className="h-16 w-20 mr-2" />
                <Skeleton className="h-16 w-24 mr-2" />
                <Skeleton className="h-16 w-24" />
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
