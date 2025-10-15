const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // You'll need to add this to your .env
);

// Healthcare specializations for realistic data
const SPECIALIZATIONS = [
  'General Medicine', 'Pediatrics', 'Cardiology', 'Neurology', 'Orthopedics',
  'Dermatology', 'Psychiatry', 'Emergency Medicine', 'Internal Medicine',
  'Surgery', 'Obstetrics & Gynecology', 'Radiology', 'Anesthesiology',
  'Ophthalmology', 'ENT', 'Endocrinology', 'Nephrology', 'Oncology',
  'Pulmonology', 'Gastroenterology', 'Infectious Diseases', 'Rheumatology'
];

const INDIAN_STATES = [
  'Uttar Pradesh', 'Maharashtra', 'Bihar', 'West Bengal', 'Madhya Pradesh',
  'Tamil Nadu', 'Rajasthan', 'Karnataka', 'Gujarat', 'Andhra Pradesh',
  'Odisha', 'Telangana', 'Kerala', 'Jharkhand', 'Assam', 'Punjab',
  'Chhattisgarh', 'Haryana', 'Delhi', 'Jammu and Kashmir'
];

const RURAL_LOCATIONS = [
  'Bareilly Rural', 'Kanpur Dehat', 'Muzaffarnagar Rural', 'Varanasi Rural',
  'Ahmednagar Rural', 'Solapur Rural', 'Sangli Rural', 'Kolhapur Rural',
  'Patna Rural', 'Gaya Rural', 'Darbhanga Rural', 'Muzaffarpur Rural',
  'Howrah Rural', 'North 24 Parganas Rural', 'South 24 Parganas Rural',
  'Hooghly Rural', 'Indore Rural', 'Bhopal Rural', 'Jabalpur Rural',
  'Gwalior Rural', 'Coimbatore Rural', 'Salem Rural', 'Madurai Rural',
  'Tirunelveli Rural', 'Jodhpur Rural', 'Jaipur Rural', 'Udaipur Rural',
  'Alwar Rural', 'Mysore Rural', 'Hubli Rural', 'Belgaum Rural',
  'Mangalore Rural', 'Ahmedabad Rural', 'Vadodara Rural', 'Surat Rural',
  'Rajkot Rural', 'Vijayawada Rural', 'Visakhapatnam Rural', 'Guntur Rural',
  'Nellore Rural', 'Cuttack Rural', 'Bhubaneswar Rural', 'Berhampur Rural',
  'Rourkela Rural', 'Warangal Rural', 'Nizamabad Rural', 'Karimnagar Rural',
  'Khammam Rural', 'Thiruvananthapuram Rural', 'Kochi Rural', 'Kozhikode Rural',
  'Kollam Rural'
];

// Realistic medical module content
const MODULE_CONTENT = {
  'Emergency Medicine Fundamentals': {
    category: 'Emergency Medicine',
    difficulty: 'intermediate',
    content: {
      sections: [
        {
          title: 'Triage Protocols',
          content: 'Understanding the systematic approach to patient prioritization in emergency settings, including the Manchester Triage System and its adaptation for rural healthcare facilities.',
          duration: 15
        },
        {
          title: 'Airway Management',
          content: 'Critical airway assessment and management techniques, including bag-mask ventilation, endotracheal intubation, and emergency cricothyrotomy in resource-limited settings.',
          duration: 25
        },
        {
          title: 'Cardiac Emergencies',
          content: 'Recognition and initial management of acute coronary syndromes, cardiac arrest protocols, and defibrillation techniques with emphasis on rural emergency care.',
          duration: 20
        }
      ]
    },
    tags: ['emergency', 'critical-care', 'triage', 'airway'],
    description: 'Comprehensive training on emergency medicine protocols adapted for rural healthcare settings, focusing on rapid assessment and life-saving interventions.'
  },
  'Maternal Health in Rural Settings': {
    category: 'Obstetrics & Gynecology',
    difficulty: 'advanced',
    content: {
      sections: [
        {
          title: 'Antenatal Care Protocols',
          content: 'Standardized approach to prenatal care in rural settings, including risk assessment, nutrition counseling, and identification of high-risk pregnancies.',
          duration: 30
        },
        {
          title: 'Labor Management',
          content: 'Safe delivery practices, partograph use, recognition of obstructed labor, and when to refer to higher centers for emergency obstetric care.',
          duration: 35
        },
        {
          title: 'Postpartum Care',
          content: 'Immediate and extended postpartum care, breastfeeding support, contraception counseling, and prevention of maternal complications.',
          duration: 20
        }
      ]
    },
    tags: ['maternal-health', 'obstetrics', 'rural-care', 'pregnancy'],
    description: 'Essential maternal health protocols designed for healthcare workers in rural and underserved areas, emphasizing preventive care and early intervention.'
  },
  'Pediatric Nutrition & Growth Monitoring': {
    category: 'Pediatrics',
    difficulty: 'beginner',
    content: {
      sections: [
        {
          title: 'Growth Assessment',
          content: 'Proper techniques for measuring height, weight, and head circumference in children. Understanding growth charts and identifying malnutrition early.',
          duration: 20
        },
        {
          title: 'Nutritional Counseling',
          content: 'Age-appropriate feeding practices, complementary feeding introduction, and addressing common nutritional deficiencies in rural children.',
          duration: 25
        },
        {
          title: 'Immunization Schedule',
          content: 'National immunization schedule, vaccine storage, administration techniques, and managing adverse events following immunization.',
          duration: 15
        }
      ]
    },
    tags: ['pediatrics', 'nutrition', 'immunization', 'growth'],
    description: 'Fundamental pediatric care focusing on nutrition assessment, growth monitoring, and preventive healthcare for children in rural communities.'
  },
  'Infectious Disease Management': {
    category: 'Internal Medicine',
    difficulty: 'intermediate',
    content: {
      sections: [
        {
          title: 'Fever Assessment',
          content: 'Systematic approach to fever evaluation, differential diagnosis of common febrile illnesses, and appropriate use of diagnostic tests.',
          duration: 25
        },
        {
          title: 'Antibiotic Stewardship',
          content: 'Rational antibiotic use, understanding resistance patterns, and appropriate treatment duration for common bacterial infections.',
          duration: 30
        },
        {
          title: 'Vector-borne Diseases',
          content: 'Recognition and management of malaria, dengue, chikungunya, and other endemic diseases common in rural India.',
          duration: 20
        }
      ]
    },
    tags: ['infectious-disease', 'antibiotics', 'fever', 'vector-borne'],
    description: 'Comprehensive approach to infectious disease management with emphasis on common conditions in rural India and appropriate antimicrobial use.'
  },
  'Mental Health First Aid': {
    category: 'Psychiatry',
    difficulty: 'beginner',
    content: {
      sections: [
        {
          title: 'Mental Health Screening',
          content: 'Basic screening tools for depression, anxiety, and other common mental health conditions. Cultural sensitivity in mental health assessment.',
          duration: 20
        },
        {
          title: 'Crisis Intervention',
          content: 'De-escalation techniques, suicide risk assessment, and immediate safety measures for patients in mental health crisis.',
          duration: 25
        },
        {
          title: 'Community Resources',
          content: 'Connecting patients with available mental health resources, family involvement, and long-term follow-up strategies.',
          duration: 15
        }
      ]
    },
    tags: ['mental-health', 'screening', 'crisis', 'community'],
    description: 'Essential mental health skills for healthcare workers, focusing on early recognition, crisis management, and community-based support systems.'
  },
  'Diabetes Management in Primary Care': {
    category: 'Endocrinology',
    difficulty: 'intermediate',
    content: {
      sections: [
        {
          title: 'Diagnosis and Screening',
          content: 'Diabetes screening protocols, interpretation of blood glucose and HbA1c values, and risk factor assessment in rural populations.',
          duration: 20
        },
        {
          title: 'Lifestyle Interventions',
          content: 'Dietary counseling adapted to local food habits, physical activity recommendations, and patient education for self-management.',
          duration: 30
        },
        {
          title: 'Medication Management',
          content: 'Oral hypoglycemic agents, insulin initiation and adjustment, and monitoring for complications in resource-limited settings.',
          duration: 25
        }
      ]
    },
    tags: ['diabetes', 'primary-care', 'lifestyle', 'medication'],
    description: 'Comprehensive diabetes care protocols for primary healthcare settings, emphasizing lifestyle interventions and practical management strategies.'
  },
  'Hypertension Control Program': {
    category: 'Cardiology',
    difficulty: 'beginner',
    content: {
      sections: [
        {
          title: 'Blood Pressure Measurement',
          content: 'Proper blood pressure measurement techniques, equipment calibration, and interpretation of readings in different patient populations.',
          duration: 15
        },
        {
          title: 'Risk Stratification',
          content: 'Assessment of cardiovascular risk factors, target organ damage evaluation, and classification of hypertension severity.',
          duration: 20
        },
        {
          title: 'Treatment Protocols',
          content: 'Step-wise approach to hypertension management, medication selection, and lifestyle modification counseling.',
          duration: 25
        }
      ]
    },
    tags: ['hypertension', 'cardiovascular', 'screening', 'prevention'],
    description: 'Systematic approach to hypertension management in community settings, focusing on early detection, risk assessment, and effective treatment.'
  },
  'Tuberculosis Detection & Management': {
    category: 'Pulmonology',
    difficulty: 'advanced',
    content: {
      sections: [
        {
          title: 'Clinical Diagnosis',
          content: 'Recognition of TB symptoms, chest X-ray interpretation, and appropriate use of diagnostic tests including sputum microscopy.',
          duration: 30
        },
        {
          title: 'Treatment Protocols',
          content: 'DOTS implementation, drug regimens for different TB categories, and management of drug-resistant tuberculosis.',
          duration: 35
        },
        {
          title: 'Contact Tracing',
          content: 'Household contact screening, prevention strategies, and community education for tuberculosis control.',
          duration: 20
        }
      ]
    },
    tags: ['tuberculosis', 'infectious-disease', 'dots', 'contact-tracing'],
    description: 'Comprehensive tuberculosis management program including diagnosis, treatment supervision, and community-based prevention strategies.'
  }
};

async function clearDatabase() {
  console.log('🗑️  Clearing existing data...');
  
  // Tables to clear (in order to respect foreign key constraints)
  // Core tables from 001_create_schema.sql and additional feature tables
  const tablesToClear = [
    // Chat and messages (from 001_create_schema.sql)
    'chat_messages',
    'chat_sessions',
    
    // Gamification (from 011_add_streaks_and_gamification.sql)
    'user_achievements',
    'recommendations',
    'weak_areas',
    'daily_activities',
    'study_streaks',
    
    // Learning features (from 010_add_learning_features.sql)
    'quiz_sessions',
    'progress_shares',
    'peer_connections',
    'bookmarked_questions',
    'spaced_repetition',
    
    // Core application data (from 001_create_schema.sql)
    'deployment_applications',
    'assessment_attempts',
    'certifications',
    'progress',
    'assessments',
    'modules',
    'emergency_alerts',
    'deployments'
  ];

  for (const table of tablesToClear) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
      
      if (error) {
        console.warn(`⚠️  Warning clearing ${table}:`, error.message);
      } else {
        console.log(`✅ Cleared ${table}`);
      }
    } catch (err) {
      console.warn(`⚠️  Error clearing ${table}:`, err.message);
    }
  }
  
  console.log('✅ Database cleared successfully!');
}

async function seedModules() {
  console.log('📚 Seeding learning modules...');
  
  const modules = [];
  
  for (const [title, moduleData] of Object.entries(MODULE_CONTENT)) {
    const totalDuration = moduleData.content.sections.reduce((sum, section) => sum + section.duration, 0);
    
    modules.push({
      title,
      description: moduleData.description,
      content: moduleData.content,
      difficulty: moduleData.difficulty,
      category: moduleData.category,
      tags: moduleData.tags,
      prerequisites: [],
      duration_minutes: totalDuration,
      is_published: true
    });
  }
  
  const { data: insertedModules, error } = await supabase
    .from('modules')
    .insert(modules)
    .select();
    
  if (error) {
    console.error('❌ Error seeding modules:', error);
    throw error;
  }
  
  console.log(`✅ Seeded ${insertedModules.length} modules`);
  return insertedModules;
}

async function seedAssessments(modules) {
  console.log('📝 Seeding assessments...');
  
  const assessments = [];
  
  for (const module of modules) {
    // Generate 2-3 assessments per module with realistic medical questions
    const moduleAssessments = generateAssessmentsForModule(module);
    assessments.push(...moduleAssessments);
  }
  
  const { data: insertedAssessments, error } = await supabase
    .from('assessments')
    .insert(assessments)
    .select();
    
  if (error) {
    console.error('❌ Error seeding assessments:', error);
    throw error;
  }
  
  console.log(`✅ Seeded ${insertedAssessments.length} assessments`);
  return insertedAssessments;
}

function generateAssessmentsForModule(module) {
  const assessments = [];
  
  // Quiz questions based on module category
  const questionSets = {
    'Emergency Medicine': [
      {
        question: "What is the first priority in the primary assessment of a trauma patient?",
        options: ["Airway", "Breathing", "Circulation", "Disability"],
        correct: 0,
        explanation: "Airway is the first priority in the ABCDE approach to trauma assessment."
      },
      {
        question: "Which medication is first-line for anaphylaxis?",
        options: ["Epinephrine", "Diphenhydramine", "Methylprednisolone", "Salbutamol"],
        correct: 0,
        explanation: "Epinephrine is the first-line treatment for anaphylaxis due to its rapid onset and life-saving effects."
      },
      {
        question: "At what compression depth should chest compressions be performed?",
        options: ["At least 2 inches (5 cm)", "At least 2.4 inches (6 cm)", "At least 1.5 inches (4 cm)", "At least 3 inches (7 cm)"],
        correct: 0,
        explanation: "Current guidelines recommend chest compressions of at least 2 inches (5 cm) but not exceeding 2.4 inches (6 cm)."
      }
    ],
    'Obstetrics & Gynecology': [
      {
        question: "What is the normal range for fetal heart rate during labor?",
        options: ["110-160 beats per minute", "120-180 beats per minute", "100-140 beats per minute", "130-170 beats per minute"],
        correct: 0,
        explanation: "Normal fetal heart rate during labor is 110-160 beats per minute."
      },
      {
        question: "Which drug is used for postpartum hemorrhage control?",
        options: ["Oxytocin", "Magnesium sulfate", "Nifedipine", "Methyldopa"],
        correct: 0,
        explanation: "Oxytocin is the first-line drug for prevention and treatment of postpartum hemorrhage."
      },
      {
        question: "At what gestational age is a pregnancy considered term?",
        options: ["37-42 weeks", "38-40 weeks", "36-41 weeks", "39-41 weeks"],
        correct: 0,
        explanation: "A pregnancy is considered term between 37-42 weeks of gestation."
      }
    ],
    'Pediatrics': [
      {
        question: "What is the recommended age for starting complementary feeding?",
        options: ["6 months", "4 months", "8 months", "3 months"],
        correct: 0,
        explanation: "WHO recommends exclusive breastfeeding for 6 months, then introducing complementary foods."
      },
      {
        question: "Which vaccine is given at birth in India?",
        options: ["BCG and OPV", "DPT and Hepatitis B", "MMR", "Rotavirus"],
        correct: 0,
        explanation: "BCG and OPV (oral polio vaccine) are given at birth as per Indian immunization schedule."
      },
      {
        question: "What is the normal respiratory rate for a 2-year-old child?",
        options: ["20-30 breaths per minute", "15-25 breaths per minute", "25-35 breaths per minute", "30-40 breaths per minute"],
        correct: 0,
        explanation: "Normal respiratory rate for a 2-year-old is 20-30 breaths per minute."
      }
    ],
    'Internal Medicine': [
      {
        question: "What is the first-line antibiotic for community-acquired pneumonia?",
        options: ["Amoxicillin", "Azithromycin", "Ciprofloxacin", "Ceftriaxone"],
        correct: 0,
        explanation: "Amoxicillin is the first-line antibiotic for uncomplicated community-acquired pneumonia."
      },
      {
        question: "Which diagnostic test is most specific for myocardial infarction?",
        options: ["Troponin I", "CK-MB", "LDH", "AST"],
        correct: 0,
        explanation: "Troponin I is highly specific and sensitive for myocardial infarction."
      },
      {
        question: "What is the target blood pressure for most diabetic patients?",
        options: ["<130/80 mmHg", "<140/90 mmHg", "<120/80 mmHg", "<150/90 mmHg"],
        correct: 0,
        explanation: "Current guidelines recommend a target BP of <130/80 mmHg for most diabetic patients."
      }
    ],
    'Psychiatry': [
      {
        question: "What is the most common mental health condition in primary care?",
        options: ["Depression", "Anxiety", "Bipolar disorder", "Schizophrenia"],
        correct: 0,
        explanation: "Depression is the most commonly encountered mental health condition in primary care settings."
      },
      {
        question: "Which screening tool is commonly used for depression?",
        options: ["PHQ-9", "MMSE", "GAF", "CAGE"],
        correct: 0,
        explanation: "PHQ-9 (Patient Health Questionnaire-9) is a widely used screening tool for depression."
      },
      {
        question: "What is the immediate priority in suicide risk assessment?",
        options: ["Safety planning", "Medication review", "Family history", "Cognitive assessment"],
        correct: 0,
        explanation: "Immediate safety planning and risk mitigation is the priority in suicide risk assessment."
      }
    ]
  };

  // Default questions for categories not specified
  const defaultQuestions = [
    {
      question: "What is the most important principle in patient care?",
      options: ["Patient safety", "Cost effectiveness", "Time efficiency", "Documentation"],
      correct: 0,
      explanation: "Patient safety should always be the primary concern in all healthcare interventions."
    },
    {
      question: "When should you wash your hands in clinical practice?",
      options: ["Before and after patient contact", "Only after patient contact", "Only when visibly soiled", "At the end of the shift"],
      correct: 0,
      explanation: "Hand hygiene should be performed before and after every patient contact to prevent infection transmission."
    }
  ];

  const questions = questionSets[module.category] || defaultQuestions;
  
  // Create practice quiz
  assessments.push({
    module_id: module.id,
    title: `${module.title} - Practice Quiz`,
    questions: questions.slice(0, Math.min(questions.length, 5)),
    passing_score: 70,
    time_limit_minutes: 15
  });
  
  // Create final assessment
  if (questions.length > 3) {
    assessments.push({
      module_id: module.id,
      title: `${module.title} - Final Assessment`,
      questions: questions,
      passing_score: 80,
      time_limit_minutes: 30
    });
  }
  
  return assessments;
}

async function seedDeployments() {
  console.log('🏥 Seeding rural deployments...');
  
  const deployments = [];
  
  for (let i = 0; i < 25; i++) {
    const location = RURAL_LOCATIONS[Math.floor(Math.random() * RURAL_LOCATIONS.length)];
    const state = INDIAN_STATES[Math.floor(Math.random() * INDIAN_STATES.length)];
    const specialization = SPECIALIZATIONS[Math.floor(Math.random() * SPECIALIZATIONS.length)];
    const priority = ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)];
    
    const district = location.replace(' Rural', '');
    
    deployments.push({
      location,
      state,
      district,
      specialization_needed: specialization,
      priority,
      available_positions: Math.floor(Math.random() * 5) + 1,
      requirements: {
        min_experience: Math.floor(Math.random() * 5),
        preferred_languages: getLocalLanguages(state),
        accommodation_provided: Math.random() > 0.3,
        transport_allowance: Math.random() > 0.4,
        additional_benefits: [
          'Medical insurance',
          'Professional development opportunities',
          'Rural posting allowance'
        ]
      },
      description: generateDeploymentDescription(location, specialization, priority)
    });
  }
  
  const { error } = await supabase
    .from('deployments')
    .insert(deployments);
    
  if (error) {
    console.error('❌ Error seeding deployments:', error);
    throw error;
  }
  
  console.log(`✅ Seeded ${deployments.length} rural deployments`);
}

function getLocalLanguages(state) {
  const languages = {
    'Uttar Pradesh': ['Hindi', 'Urdu'],
    'Maharashtra': ['Marathi', 'Hindi'],
    'Tamil Nadu': ['Tamil', 'English'],
    'Karnataka': ['Kannada', 'Hindi'],
    'Kerala': ['Malayalam', 'English'],
    'West Bengal': ['Bengali', 'Hindi'],
    'Gujarat': ['Gujarati', 'Hindi'],
    'Punjab': ['Punjabi', 'Hindi'],
    'Rajasthan': ['Hindi', 'Rajasthani'],
    'Andhra Pradesh': ['Telugu', 'Hindi']
  };
  return languages[state] || ['Hindi', 'English'];
}

function generateDeploymentDescription(location, specialization, priority) {
  const urgencyText = {
    'critical': 'URGENT: Immediate deployment required due to acute shortage of healthcare professionals.',
    'high': 'High priority posting with excellent career growth opportunities.',
    'medium': 'Rewarding opportunity to serve rural communities with comprehensive support.',
    'low': 'Stable posting with focus on preventive healthcare and community wellness.'
  };
  
  return `${urgencyText[priority]} ${location} requires dedicated ${specialization} specialist to serve the local rural population. The position offers competitive compensation, professional development support, and the opportunity to make a meaningful impact in underserved communities. The facility serves approximately ${Math.floor(Math.random() * 50000) + 10000} people in the catchment area.`;
}

async function seedEmergencyAlerts() {
  console.log('🚨 Seeding emergency alerts...');
  
  const alerts = [
    {
      title: 'Vector-Borne Disease Outbreak Alert',
      description: 'Increased cases of dengue fever reported in multiple districts. Healthcare workers should maintain high vigilance for fever cases and ensure proper vector control measures.',
      severity: 'warning',
      category: 'disease_outbreak',
      affected_regions: ['Maharashtra', 'Karnataka', 'Tamil Nadu'],
      action_required: 'Implement enhanced surveillance protocols, ensure adequate diagnostic supplies, and educate communities about prevention measures.',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    },
    {
      title: 'Monsoon Health Advisory',
      description: 'With monsoon season approaching, increased risk of waterborne diseases and respiratory infections. Healthcare facilities should prepare for seasonal disease patterns.',
      severity: 'info',
      category: 'seasonal_advisory',
      affected_regions: ['All States'],
      action_required: 'Stock essential medicines, ensure water quality testing, and conduct community awareness programs.',
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
    },
    {
      title: 'Critical Drug Shortage - Insulin',
      description: 'Shortage of insulin supplies reported in several rural areas. Immediate action required to ensure continuity of care for diabetic patients.',
      severity: 'critical',
      category: 'supply_shortage',
      affected_regions: ['Uttar Pradesh', 'Bihar', 'Jharkhand'],
      action_required: 'Contact district health office for emergency supplies, implement rationing protocols, and identify alternative treatment options.',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    },
    {
      title: 'Vaccination Drive Update',
      description: 'National immunization drive scheduled for next month. All healthcare workers should prepare for increased patient volumes and ensure adequate vaccine storage.',
      severity: 'info',
      category: 'vaccination',
      affected_regions: ['All States'],
      action_required: 'Verify cold chain maintenance, train additional staff, and coordinate with local authorities.',
      expires_at: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) // 45 days from now
    }
  ];
  
  const { error } = await supabase
    .from('emergency_alerts')
    .insert(alerts);
    
  if (error) {
    console.error('❌ Error seeding emergency alerts:', error);
    throw error;
  }
  
  console.log(`✅ Seeded ${alerts.length} emergency alerts`);
}

async function seedKnowledgeUpdates() {
  console.log('📰 Seeding knowledge updates...');
  
  // Check if knowledge_updates table exists (from 005_create_chat_tables.sql)
  const { error: checkError } = await supabase
    .from('knowledge_updates')
    .select('id')
    .limit(1);
  
  if (checkError && checkError.code === 'PGRST204') {
    console.log('⏭️  Skipping knowledge updates (table does not exist yet - run 005_create_chat_tables.sql first)');
    return;
  }
  
  const updates = [
    {
      title: 'New WHO Guidelines for Tuberculosis Treatment',
      content: 'The World Health Organization has released updated guidelines for tuberculosis treatment, emphasizing shorter treatment regimens for drug-susceptible TB and new recommendations for drug-resistant cases. Key changes include revised dosing for children and updated drug safety monitoring protocols.',
      category: 'guidelines',
      source: 'World Health Organization',
      priority: 'high',
      tags: ['tuberculosis', 'treatment', 'guidelines', 'who']
    },
    {
      title: 'COVID-19 Variant Surveillance Update',
      content: 'Latest epidemiological data shows emergence of new SARS-CoV-2 variants. Healthcare workers should maintain vigilance for unusual symptom patterns and ensure appropriate testing protocols are followed. Updated isolation guidelines and treatment recommendations are now available.',
      category: 'infectious_disease',
      source: 'Indian Council of Medical Research',
      priority: 'high',
      tags: ['covid19', 'variants', 'surveillance', 'icmr']
    },
    {
      title: 'Maternal Mortality Reduction Strategies',
      content: 'Recent research highlights effective interventions for reducing maternal mortality in rural settings. Key strategies include improved antenatal care quality, skilled birth attendance, and timely referral systems. Implementation guidelines for resource-limited settings are now available.',
      category: 'maternal_health',
      source: 'Ministry of Health and Family Welfare',
      priority: 'medium',
      tags: ['maternal-health', 'mortality', 'rural-care', 'mohfw']
    },
    {
      title: 'Digital Health Tools for Rural Healthcare',
      content: 'New mobile health applications and telemedicine platforms have been validated for use in rural Indian healthcare settings. These tools can support clinical decision-making, patient monitoring, and continuing medical education for healthcare workers in remote areas.',
      category: 'digital_health',
      source: 'National Health Mission',
      priority: 'medium',
      tags: ['digital-health', 'telemedicine', 'rural-care', 'mobile-health']
    },
    {
      title: 'Antimicrobial Resistance Prevention',
      content: 'Updated protocols for antimicrobial stewardship in primary healthcare settings. Focus on rational antibiotic prescribing, infection prevention measures, and laboratory capacity strengthening. New diagnostic algorithms for common infections to reduce inappropriate antibiotic use.',
      category: 'antimicrobial_resistance',
      source: 'Indian Council of Medical Research',
      priority: 'high',
      tags: ['antimicrobial-resistance', 'antibiotics', 'stewardship', 'infection-control']
    },
    {
      title: 'Mental Health Integration in Primary Care',
      content: 'National Mental Health Program updates include new protocols for integrating mental health services into primary healthcare. Training modules for recognizing common mental health conditions and basic intervention strategies are now available for rural healthcare workers.',
      category: 'mental_health',
      source: 'National Institute of Mental Health',
      priority: 'medium',
      tags: ['mental-health', 'primary-care', 'integration', 'training']
    }
  ];
  
  const { error } = await supabase
    .from('knowledge_updates')
    .insert(updates);
    
  if (error) {
    console.error('❌ Error seeding knowledge updates:', error);
    throw error;
  }
  
  console.log(`✅ Seeded ${updates.length} knowledge updates`);
}

async function main() {
  try {
    console.log('🚀 Starting database seed process...\n');
    
    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
      console.log('Please add your Supabase service role key to your .env file:');
      console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');
      process.exit(1);
    }
    
    // Clear existing data
    await clearDatabase();
    
    console.log('\n📊 Seeding demo data...\n');
    
    // Seed in order due to foreign key dependencies
    const modules = await seedModules();
    await seedAssessments(modules);
    await seedDeployments();
    await seedEmergencyAlerts();
    
    // Try to seed knowledge updates (may not exist if 005_create_chat_tables.sql not run)
    try {
      await seedKnowledgeUpdates();
    } catch (error) {
      if (error.code === 'PGRST204' || error.message?.includes('Could not find the table')) {
        console.log('⏭️  Skipping knowledge updates (table does not exist - run 005_create_chat_tables.sql first)');
      } else {
        throw error;
      }
    }
    
    console.log('\n🎉 Demo data seeding completed successfully!');
    console.log('\nSummary:');
    console.log(`• ${Object.keys(MODULE_CONTENT).length} learning modules`);
    console.log(`• ${Object.keys(MODULE_CONTENT).length * 2} assessments (practice & final)`);
    console.log('• 25 rural deployment opportunities');
    console.log('• 4 emergency alerts');
    console.log('• Knowledge updates (if table exists)');
    console.log('\n✅ Your MedReady AI platform is now ready with realistic demo data!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Make sure all migration scripts have been run (001, 003, 005, 008, 010, 011)');
    console.log('2. Check that your SUPABASE_SERVICE_ROLE_KEY is correct in .env');
    console.log('3. Verify your Supabase project is running and accessible');
    process.exit(1);
  }
}

// Run the seeding script
main();