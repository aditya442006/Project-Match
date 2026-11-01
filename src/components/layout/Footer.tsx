import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
            PM
          </div>
          <span>&copy; {new Date().getFullYear()} ProjectMatch. Built for student collaboration & hackathons.</span>
        </div>

        <div className="flex items-center gap-6">
          <Link to="/projects" className="hover:text-indigo-600 dark:hover:text-indigo-400">
            Projects
          </Link>
          <Link to="/matching" className="hover:text-indigo-600 dark:hover:text-indigo-400">
            Find Teammates
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
};
