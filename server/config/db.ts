// Seeded Skills Taxonomy (Frontend, Backend, ML, Design, Mobile, DevOps, etc.)
export const initialSkills = [
  { id: 'skill-1', name: 'React', category: 'frontend', aliases: ['reactjs', 'react.js'], is_active: true },
  { id: 'skill-2', name: 'TypeScript', category: 'frontend', aliases: ['ts'], is_active: true },
  { id: 'skill-3', name: 'Tailwind CSS', category: 'frontend', aliases: ['tailwind'], is_active: true },
  { id: 'skill-4', name: 'Node.js', category: 'backend', aliases: ['nodejs', 'node'], is_active: true },
  { id: 'skill-5', name: 'Python', category: 'backend', aliases: ['py'], is_active: true },
  { id: 'skill-6', name: 'Express', category: 'backend', aliases: ['expressjs'], is_active: true },
  { id: 'skill-7', name: 'PostgreSQL', category: 'database', aliases: ['postgres', 'psql'], is_active: true },
  { id: 'skill-8', name: 'MongoDB', category: 'database', aliases: ['mongo'], is_active: true },
  { id: 'skill-9', name: 'PyTorch', category: 'ml', aliases: ['torch'], is_active: true },
  { id: 'skill-10', name: 'TensorFlow', category: 'ml', aliases: ['tf'], is_active: true },
  { id: 'skill-11', name: 'NLP & Transformers', category: 'ml', aliases: ['nlp', 'bert', 'llm'], is_active: true },
  { id: 'skill-12', name: 'Figma', category: 'design', aliases: ['ui/ux'], is_active: true },
  { id: 'skill-13', name: 'Docker', category: 'devops', aliases: ['containers'], is_active: true },
  { id: 'skill-14', name: 'FastAPI', category: 'backend', aliases: ['fast-api'], is_active: true },
  { id: 'skill-15', name: 'Next.js', category: 'frontend', aliases: ['nextjs'], is_active: true },
  { id: 'skill-16', name: 'Flutter', category: 'mobile', aliases: ['dart'], is_active: true },
  { id: 'skill-17', name: 'React Native', category: 'mobile', aliases: ['rn'], is_active: true },
];

// Seeded Demo Users
export const initialUsers = [
  {
    id: 'user-aditya',
    email: 'aditya@stanford.edu',
    passwordHash: '$2b$10$demoHashedPasswordPlaceHolder',
    name: 'Aditya Manhas',
    role: 'admin',
    is_verified: true,
    is_active: true,
    college: 'Stanford University',
    branch: 'Computer Science',
    year: 3,
    bio: 'Full-stack builder passionate about developer tools, distributed systems, and AI teammates.',
    skills: [
      { id: 's-1', name: 'React', level: 5, years_exp: 3 },
      { id: 's-2', name: 'TypeScript', level: 5, years_exp: 3 },
      { id: 's-3', name: 'Node.js', level: 4, years_exp: 2 },
      { id: 's-4', name: 'PostgreSQL', level: 4, years_exp: 2 },
    ],
    preferred_tech: ['React', 'TypeScript', 'PostgreSQL', 'Tailwind CSS'],
    interests: ['AI Hackathons', 'Open Source', 'Autonomous Agents'],
    looking_for: ['hackathon', 'project'],
    experience: [{ title: 'Undergraduate Research Assistant', description: 'Worked on NLP evaluation pipelines' }],
    availability: {
      hours_per_week: 15,
      timezone: 'America/Los_Angeles',
      slots: ['Weekday Evenings', 'Weekend Mornings'],
    },
    profile_completeness: 95,
    reputation_avg: 4.9,
    reputation_count: 12,
  },
  {
    id: 'user-priya',
    email: 'priya@mit.edu',
    name: 'Priya Sharma',
    role: 'student',
    is_verified: true,
    is_active: true,
    college: 'MIT',
    branch: 'Artificial Intelligence',
    year: 2,
    bio: 'ML researcher focusing on fine-tuning multimodal models and retrieval-augmented generation.',
    skills: [
      { id: 's-5', name: 'Python', level: 5, years_exp: 3 },
      { id: 's-6', name: 'PyTorch', level: 5, years_exp: 2 },
      { id: 's-7', name: 'NLP & Transformers', level: 4, years_exp: 2 },
      { id: 's-8', name: 'FastAPI', level: 4, years_exp: 2 },
    ],
    preferred_tech: ['Python', 'PyTorch', 'FastAPI'],
    interests: ['Deep Learning', 'LLMs', 'Healthcare AI'],
    looking_for: ['hackathon', 'competition'],
    experience: [{ title: 'ML Intern', description: 'Built sentiment analysis pipeline' }],
    availability: {
      hours_per_week: 20,
      timezone: 'America/New_York',
      slots: ['Weekday Afternoons', 'Weekend Evenings'],
    },
    profile_completeness: 90,
    reputation_avg: 4.8,
    reputation_count: 8,
  },
  {
    id: 'user-marcus',
    email: 'marcus@berkeley.edu',
    name: 'Marcus Chen',
    role: 'student',
    is_verified: true,
    is_active: true,
    college: 'UC Berkeley',
    branch: 'Cognitive Science & Design',
    year: 4,
    bio: 'Product designer passionate about intuitive accessibility, design tokens, and clean student SaaS interfaces.',
    skills: [
      { id: 's-9', name: 'Figma', level: 5, years_exp: 4 },
      { id: 's-10', name: 'Tailwind CSS', level: 4, years_exp: 2 },
      { id: 's-11', name: 'React', level: 3, years_exp: 1 },
    ],
    preferred_tech: ['Figma', 'Tailwind CSS', 'React'],
    interests: ['UI/UX', 'Product Strategy', 'Design Systems'],
    looking_for: ['project', 'internship'],
    experience: [{ title: 'Design Lead', description: 'Led design for university hackathon website' }],
    availability: {
      hours_per_week: 12,
      timezone: 'America/Los_Angeles',
      slots: ['Weekday Evenings'],
    },
    profile_completeness: 85,
    reputation_avg: 5.0,
    reputation_count: 6,
  },
  {
    id: 'user-sara',
    email: 'sara@cmu.edu',
    name: 'Sara Lindqvist',
    role: 'student',
    is_verified: true,
    is_active: true,
    college: 'Carnegie Mellon',
    branch: 'Electrical & Computer Engineering',
    year: 3,
    bio: 'Robotics & embedded systems enthusiast looking to collaborate on IoT or hardware hackathon builds.',
    skills: [
      { id: 's-12', name: 'Python', level: 4, years_exp: 2 },
      { id: 's-13', name: 'Docker', level: 4, years_exp: 2 },
      { id: 's-14', name: 'PostgreSQL', level: 3, years_exp: 1 },
    ],
    preferred_tech: ['Python', 'Docker', 'PostgreSQL'],
    interests: ['Robotics', 'Embedded IoT', 'Hackathons'],
    looking_for: ['hackathon'],
    experience: [{ title: 'Robotics Team Captain', description: 'Competed in VEX U robotics' }],
    availability: {
      hours_per_week: 15,
      timezone: 'America/New_York',
      slots: ['Weekend Mornings', 'Weekend Afternoons'],
    },
    profile_completeness: 80,
    reputation_avg: 4.7,
    reputation_count: 5,
  },
];

// Seeded Projects
export const initialProjects = [
  {
    id: 'proj-1',
    title: 'AI Campus Study Buddy & Notes Synthesizer',
    description: 'Building an intelligent companion that ingests course syllabi, lecture slides, and generates quiz flashcards with spaced repetition.',
    type: 'hackathon',
    status: 'open',
    mode: 'online',
    tags: ['Next.js', 'PyTorch', 'FastAPI', 'Tailwind CSS'],
    start_date: '2026-11-15',
    deadline: '2026-12-05',
    team_size_min: 2,
    team_size_max: 4,
    roles: [
      { role: 'Frontend Engineer', slots: 1, filled: 1, skills: ['React', 'TypeScript'] },
      { role: 'ML Engineer', slots: 1, filled: 0, skills: ['Python', 'PyTorch'] },
      { role: 'Product Designer', slots: 1, filled: 0, skills: ['Figma'] },
    ],
    required_skills: ['React', 'Python', 'PyTorch', 'Figma'],
    owner: initialUsers[0],
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'proj-2',
    title: 'EcoRoute: Micro-Mobility Route Optimizer',
    description: 'An open-source navigation app designed for electric scooters and bicycles with safe bike-lane weighting and weather alerts.',
    type: 'project',
    status: 'open',
    mode: 'hybrid',
    tags: ['React Native', 'PostgreSQL', 'Docker'],
    start_date: '2026-11-20',
    deadline: '2027-01-15',
    team_size_min: 2,
    team_size_max: 4,
    roles: [
      { role: 'Mobile Developer', slots: 2, filled: 1, skills: ['Flutter', 'React Native'] },
      { role: 'Backend / DevOps', slots: 1, filled: 0, skills: ['Node.js', 'PostgreSQL', 'Docker'] },
    ],
    required_skills: ['React Native', 'Node.js', 'PostgreSQL'],
    owner: initialUsers[1],
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

// Seeded Teams
export const initialTeams = [
  {
    id: 'team-1',
    project_id: 'proj-1',
    project: initialProjects[0],
    name: 'CampusAI Hackers',
    status: 'active',
    leader_id: 'user-aditya',
    leader: initialUsers[0],
    members: [
      { user: initialUsers[0], role: 'Project Lead & Full-Stack', joined_at: new Date().toISOString() },
      { user: initialUsers[2], role: 'UI/UX Designer', joined_at: new Date().toISOString() },
    ],
    conversation_id: 'conv-team-1',
    task_summary: { total: 4, done: 1 },
    created_at: new Date().toISOString(),
  },
];

// Seeded Tasks
export const initialTasks = [
  {
    id: 'task-1',
    team_id: 'team-1',
    title: 'Design high-fidelity Figma components for dashboard',
    description: 'Create responsive card layouts, color variables, and score rings in Figma.',
    assignee_id: 'user-marcus',
    assignee: initialUsers[2],
    created_by: 'user-aditya',
    status: 'done',
    priority: 'high',
    due_date: '2026-11-10',
    labels: ['Design', 'UI'],
    comments: [],
    position: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'task-2',
    team_id: 'team-1',
    title: 'Implement document vector embedding pipeline',
    description: 'Set up chunking and sentence embeddings for PDF lecture notes.',
    assignee_id: 'user-aditya',
    assignee: initialUsers[0],
    created_by: 'user-aditya',
    status: 'in_progress',
    priority: 'high',
    due_date: '2026-11-14',
    labels: ['ML', 'Backend'],
    comments: [],
    position: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'task-3',
    team_id: 'team-1',
    title: 'Connect Socket.IO rooms for real-time collaboration',
    description: 'Ensure typing events and message read receipts fire reliably across clients.',
    assignee_id: 'user-aditya',
    assignee: initialUsers[0],
    created_by: 'user-aditya',
    status: 'todo',
    priority: 'medium',
    due_date: '2026-11-18',
    labels: ['Sockets'],
    comments: [],
    position: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'task-4',
    team_id: 'team-1',
    title: 'Prepare project submission video and slide deck',
    description: '3-minute demo script showcasing AI matching and team workspace.',
    assignee_id: 'user-marcus',
    assignee: initialUsers[2],
    created_by: 'user-aditya',
    status: 'review',
    priority: 'medium',
    due_date: '2026-11-20',
    labels: ['Presentation'],
    comments: [],
    position: 0,
    created_at: new Date().toISOString(),
  },
];

// Seeded Conversations & Messages
export const initialConversations = [
  {
    id: 'conv-team-1',
    type: 'team',
    team_id: 'team-1',
    participants: [initialUsers[0], initialUsers[2]],
    last_message_at: new Date().toISOString(),
    last_message: 'Hey team, welcome to our project workspace!',
    unread_count: 0,
  },
];

export const initialMessages = [
  {
    id: 'msg-1',
    conversation_id: 'conv-team-1',
    sender_id: 'user-aditya',
    sender: initialUsers[0],
    text: 'Hey Marcus! Welcome to the team. Excited to hack on this project together.',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    status: 'delivered',
  },
  {
    id: 'msg-2',
    conversation_id: 'conv-team-1',
    sender_id: 'user-marcus',
    sender: initialUsers[2],
    text: 'Thanks Aditya! I have reviewed the design specs and started working on the card primitives.',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    status: 'delivered',
  },
];

export interface DbStore {
  users: any[];
  skills: any[];
  projects: any[];
  teams: any[];
  tasks: any[];
  conversations: any[];
  messages: any[];
  requests: any[];
  notifications: any[];
  ratings: any[];
  feedback: any[];
  auditLogs: any[];
  reports: any[];
}

// In-memory runtime state that updates during server execution
export const db: DbStore = {
  users: [...initialUsers],
  skills: [...initialSkills],
  projects: [...initialProjects],
  teams: [...initialTeams],
  tasks: [...initialTasks],
  conversations: [...initialConversations],
  messages: [...initialMessages],
  requests: [
    {
      id: 'req-demo-1',
      type: 'invite' as const,
      project_id: 'proj-1',
      project: initialProjects[0],
      team_id: 'team-1',
      from_user: initialUsers[1],
      to_user: initialUsers[0],
      role: 'ML Engineer',
      message: 'Hey Aditya, I loved your study buddy idea! Would love to help build the NLP model.',
      status: 'pending' as const,
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
  ],
  notifications: [
    {
      id: 'notif-1',
      user_id: 'user-aditya',
      type: 'invite',
      title: 'New Team Application',
      body: 'Priya Sharma applied for ML Engineer on AI Campus Study Buddy.',
      data: { project_id: 'proj-1' },
      is_read: false,
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'notif-2',
      user_id: 'user-aditya',
      type: 'task_assigned',
      title: 'Task Assigned',
      body: 'You have been assigned to "Implement document vector embedding pipeline".',
      data: { team_id: 'team-1' },
      is_read: true,
      created_at: new Date(Date.now() - 14400000).toISOString(),
    },
  ],
  ratings: [] as any[],
  feedback: [] as any[],
  auditLogs: [
    {
      id: 'audit-1',
      admin: initialUsers[0],
      action: 'TAXONOMY_SEEDED',
      target_type: 'skill',
      target_id: 'taxonomy-root',
      created_at: new Date().toISOString(),
    },
  ],
  reports: [] as any[],
};
