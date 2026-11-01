import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Sparkles,
  Users,
  FolderGit2,
  CheckCircle2,
  ArrowRight,
  Kanban,
  MessageSquare,
  Award,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const Landing: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>AI-Powered Teammate & Project Matching for Students</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Stop hacking solo. <br />
            Find your ideal teammates with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              complementary skills
            </span>
            .
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            ProjectMatch pairs college students for hackathons, capstones, and side projects based on semantic skill embeddings, availability overlap, and verifiable peer ratings.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={isAuthenticated ? '/dashboard' : '/register'}>
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto px-8 shadow-md"
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Get Started with College Email'}
              </Button>
            </Link>
            <Link to="/projects">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-6">
                Explore Open Projects
              </Button>
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Verified student profiles</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Complementary skill gap filling</span>
            </div>
            <div className="flex items-center gap-2 hidden sm:flex">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Real-time chat & Kanban</span>
            </div>
          </div>
        </div>

        {/* Decorative Grid Gradient */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none opacity-40 dark:opacity-20">
          <div className="w-[600px] h-[600px] bg-gradient-to-tr from-indigo-500 to-violet-400 rounded-full blur-[130px]" />
        </div>
      </section>

      {/* How Matching Works Section */}
      <section className="py-16 bg-slate-100/70 dark:bg-slate-900/50 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Why ProjectMatch beats random Discord groups
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Traditional team search leads to three frontend devs and no one to write the backend. We optimize for complementarity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold mb-4">
                1
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                Skill & Availability Profiling
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Add skills with proficiency levels (1-5), preferred stacks, timezone, and exact weekly hours you can commit.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold mb-4">
                2
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                Hybrid AI Recommendation
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Vector embeddings find relevant profiles; rule-based scoring scores missing skill coverage, availability overlap, and past peer reputation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold mb-4">
                3
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                Team Workspace & Reputation
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Work together with built-in Socket.IO chat, task boards, and leave mutual peer reviews to build your verified student track record.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <Sparkles className="w-6 h-6 text-indigo-600 mb-3" />
              <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Explainable AI</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Transparent breakdowns of why each match fits, including matched vs. missing skills and suggested roles.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <MessageSquare className="w-6 h-6 text-indigo-600 mb-3" />
              <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Real-Time Chat</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Team channels and direct messaging with typing indicators, delivery ticks, and read receipts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <Kanban className="w-6 h-6 text-indigo-600 mb-3" />
              <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Kanban Board</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                To Do, In Progress, Review, Done columns with task assignment, due date flags, and discussion threads.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <Award className="w-6 h-6 text-indigo-600 mb-3" />
              <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Peer Ratings</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Post-project ratings for teamwork, communication, technical skill, and reliability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-indigo-900 to-indigo-950 text-white mt-auto">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to build your next big project?</h2>
          <p className="text-indigo-200 text-sm max-w-xl mx-auto mb-8">
            Create your profile in 2 minutes, get matched with talented peers, and start collaborating today.
          </p>
          <Link to={isAuthenticated ? '/dashboard' : '/register'}>
            <Button
              variant="primary"
              size="lg"
              className="bg-white text-indigo-900 hover:bg-indigo-50 border-transparent shadow-lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Join ProjectMatch Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};
