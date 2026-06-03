// Single source of truth for service categories + their suggested skill tags.
// Both the client's "Post a job" form and the freelancer's "Skill profile" form
// import from here so a job's category and a skill profile's category share the
// SAME vocabulary. Discovery matching keys off exact category equality + skill
// overlap, so the lists MUST stay unified (previously AddJob used "Web Developer"
// while AddSkillProfile used "Web Development", which never matched).

export const CATEGORY_SKILLS: Record<string, string[]> = {
  'UI/UX Design': ['Figma', 'Adobe XD', 'Sketch', 'Prototyping', 'User Research', 'Wireframing', 'Design Systems', 'Visual Design', 'Interaction Design', 'UI Design'],
  'Web Development': ['HTML/CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Vue.js', 'Node.js', 'PHP', 'WordPress', 'Tailwind', 'Responsive Design'],
  'Mobile Development': ['React Native', 'Flutter', 'iOS Development', 'Android Development', 'Swift', 'Kotlin', 'Firebase', 'Mobile UI/UX', 'App Store Optimization'],
  'Graphic Design': ['Adobe Photoshop', 'Adobe Illustrator', 'CorelDRAW', 'Brand Identity', 'Logo Design', 'Print Design', 'Digital Illustration', 'Typography'],
  'Content Writing': ['SEO Writing', 'Copywriting', 'Blog Writing', 'Technical Writing', 'Creative Writing', 'Editing', 'Proofreading', 'Research', 'Content Strategy'],
  'Video Editing': ['Adobe Premiere Pro', 'Final Cut Pro', 'DaVinci Resolve', 'After Effects', 'Motion Graphics', 'Color Grading', 'Audio Editing', 'Storytelling'],
  'Social Media Management': ['Content Planning', 'Instagram Marketing', 'Facebook Ads', 'Twitter Management', 'Analytics', 'Community Management', 'Copywriting', 'Canva'],
  'Digital Marketing': ['SEO', 'SEM', 'Google Ads', 'Facebook Ads', 'Email Marketing', 'Analytics', 'Content Marketing', 'Conversion Optimization'],
  'Data Analysis': ['Excel', 'SQL', 'Python', 'Power BI', 'Tableau', 'Data Visualization', 'Statistics', 'Machine Learning', 'Business Intelligence'],
  'Virtual Assistant': ['Email Management', 'Scheduling', 'Data Entry', 'Customer Service', 'Microsoft Office', 'Google Workspace', 'Communication', 'Organization'],
  'Photography': ['Portrait Photography', 'Event Photography', 'Product Photography', 'Adobe Lightroom', 'Photo Editing', 'Studio Lighting', 'Composition', 'Retouching'],
  '3D Art': ['Blender', '3D Modeling', 'Texturing', 'Rendering', 'Animation', 'Cinema 4D', 'Maya', 'ZBrush'],
  'Animation': ['2D Animation', '3D Animation', 'Character Animation', 'Motion Graphics', 'Storyboarding', 'After Effects', 'Toon Boom', 'Rigging'],
  'Voice Over': ['Voice Acting', 'Narration', 'Commercial VO', 'Character Voices', 'Audio Editing', 'Script Reading', 'Accent Work', 'Home Studio Setup'],
  'Fashion Design': ['Sketching', 'Pattern Making', 'Sewing', 'Fabric Selection', 'Fashion Illustration', 'Tailoring', 'Trend Forecasting', 'CAD Design'],
  'Makeup Artistry': ['Bridal Makeup', 'Special Effects', 'Beauty Makeup', 'Editorial Makeup', 'Color Theory', 'Contouring', 'Airbrush Makeup', 'Skincare Knowledge'],
  'Event Planning': ['Event Coordination', 'Vendor Management', 'Budget Planning', 'Logistics', 'Wedding Planning', 'Corporate Events', 'Décor Design', 'Timeline Management'],
  'Crochet': ['Amigurumi', 'Pattern Design', 'Color Theory', 'Yarn Selection', 'Custom Orders', 'Fashion Crochet', 'Home Décor', 'Granny Squares'],
};

export const CATEGORIES: string[] = Object.keys(CATEGORY_SKILLS);

export function skillsForCategory(category: string): string[] {
  return CATEGORY_SKILLS[category] || [];
}
