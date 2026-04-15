import { HomeContent } from "@/components/home-content";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center px-4 py-6 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6 text-center">
        人体肌肉示意图
      </h1>
      <HomeContent />
    </div>
  );
}
