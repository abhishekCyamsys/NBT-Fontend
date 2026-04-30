import { Link } from 'react-router-dom';
import { BookOpen, Calendar, MapPin, Search } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Navbar */}
      <header className="sticky top-0 z-50 shadow-md bg-primary">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img src="/NBTlogo.png" alt="NBT Logo" className="h-10 w-auto transition-transform hover:scale-105" />
            <span className="font-display text-xl font-bold tracking-tight text-white hidden sm:block">
              National Book Trust, India
            </span>
          </div>
          <nav className="flex items-center gap-6">
             <Link to="/visitor/events" className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20 hover:shadow-lg">
              View Events
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary py-20 lg:py-32">
        <div className="absolute inset-0 opacity-10 mix-blend-overlay">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,100 L100,0 M0,0 L100,100" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="animate-in fade-in slide-in-from-bottom-4 duration-700 font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Celebrate the World of Books
          </h1>
          <p className="animate-in fade-in slide-in-from-bottom-5 duration-1000 mx-auto mt-6 max-w-2xl text-lg text-blue-100 sm:text-xl">
            Join the largest book fairs, discover millions of titles, and experience literature like never before. Welcome to the official NBT events platform.
          </p>
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000 mt-10 flex justify-center gap-4">
            <Link
              to="/visitor/events"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-base font-bold text-primary shadow-xl transition-transform hover:scale-105"
            >
              <Search className="h-5 w-5" />
              Find Events
            </Link>
          </div>
        </div>
      </section>

      {/* Features/Stats Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="group rounded-3xl bg-white p-8 text-center shadow-lg shadow-gray-200/50 border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <BookOpen className="h-8 w-8" />
              </div>
              <h3 className="font-display text-2xl font-bold text-gray-900 mb-3">Million+ Titles</h3>
              <p className="text-gray-600 leading-relaxed">Explore diverse genres from top publishers across India and the globe.</p>
            </div>
            
            <div className="group rounded-3xl bg-white p-8 text-center shadow-lg shadow-gray-200/50 border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <Calendar className="h-8 w-8" />
              </div>
              <h3 className="font-display text-2xl font-bold text-gray-900 mb-3">Year-round Events</h3>
              <p className="text-gray-600 leading-relaxed">From the World Book Fair to regional exhibitions, the celebration never stops.</p>
            </div>
            
            <div className="group rounded-3xl bg-white p-8 text-center shadow-lg shadow-gray-200/50 border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <MapPin className="h-8 w-8" />
              </div>
              <h3 className="font-display text-2xl font-bold text-gray-900 mb-3">Nationwide Reach</h3>
              <p className="text-gray-600 leading-relaxed">Bringing the joy of reading to every corner of the country through mobile vans and local fairs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="rounded-2xl bg-primary p-4 inline-flex shadow-lg transition-transform hover:-translate-y-1">
              <img src="/NBTlogo.png" alt="NBT Logo" className="h-10 w-auto" />
            </div>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            &copy; {new Date().getFullYear()} National Book Trust, India. All rights reserved.
          </p>
          <div className="mt-4 flex justify-center gap-4 text-xs font-medium text-gray-400">
            <Link to="/visitor/events" className="hover:text-gray-900">Events</Link>
            <span>|</span>
            <span className="cursor-not-allowed">Privacy Policy</span>
            <span>|</span>
            <span className="cursor-not-allowed">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
