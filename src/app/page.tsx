import FilterForm from "@/components/FilterForm";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative overflow-hidden font-sans">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary opacity-20 blur-[100px]"></div>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-6 sm:p-12 z-10 w-full max-w-7xl mx-auto">
        
        <div className="flex flex-col items-center text-center max-w-3xl mb-12 mt-8 md:mt-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm mb-6 text-sm font-medium text-slate-600">
            <span className="flex w-2 h-2 rounded-full bg-accent mr-2 animate-pulse"></span>
            Over 10,000 students enrolled
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 drop-shadow-sm leading-[1.1]">
            Find Your <span className="text-primary">Perfect Tutor</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl leading-relaxed">
            Connect with expert educators across all grades, subjects, and mediums. Filter and book the best tutor tailored to your specific syllabus requirements today.
          </p>
        </div>

        <div className="w-full mb-16 px-2 sm:px-0">
          <FilterForm />
        </div>
        
      </main>
      
      {/* Footer */}
      <footer className="w-full z-10 border-t border-gray-200/50 bg-white/50 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500 text-sm font-medium">
          &copy; {new Date().getFullYear()} EDUS. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
