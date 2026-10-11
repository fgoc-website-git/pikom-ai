import type { Category, Engine, Member, RFP, Article, Job, Course, Policy, Forum, PortalEvent } from "./types";

export const CATS: Category[] = [
  { id:"all",        label:"All members",        color:"#38A9E0", count:157 },
  { id:"platform",   label:"AI Platform",        color:"#4338CA", count:26  },
  { id:"si",         label:"SI & Solutions",      color:"#0369A1", count:39  },
  { id:"cloud",      label:"Cloud & Infra",       color:"#0F766E", count:16  },
  { id:"cyber",      label:"Cybersecurity",       color:"#BE123C", count:8   },
  { id:"edu",        label:"Education & Talent",  color:"#B45309", count:11  },
  { id:"consult",    label:"Consultancy",         color:"#065F46", count:13  },
  { id:"enterprise", label:"Enterprise CIOs",    color:"#5B21B6", count:34  },
  { id:"gov",        label:"Government",          color:"#92400E", count:4   },
  { id:"telco",      label:"Telecom",             color:"#1E40AF", count:6   },
];

export const ENGINES: Engine[] = [
  { id:"I1",  label:"Healthcare",       color:"#BE123C", phase:"Catalytic" },
  { id:"I2",  label:"AI Cities",        color:"#0369A1", phase:"Ignite"    },
  { id:"I3",  label:"Public Services",  color:"#0F766E", phase:"Catalytic" },
  { id:"I4",  label:"Public Sector",    color:"#065F46", phase:"Ignite"    },
  { id:"I5",  label:"Education",        color:"#B45309", phase:"Ignite"    },
  { id:"I6",  label:"Agrofood",         color:"#4D7C0F", phase:"Ignite"    },
  { id:"I7",  label:"Local AI",         color:"#4338CA", phase:"Ignite"    },
  { id:"I8",  label:"Manufacturing",    color:"#1E40AF", phase:"Ignite"    },
  { id:"I9",  label:"Plantation",       color:"#15803D", phase:"Ignite"    },
  { id:"I10", label:"MSMEs",            color:"#D97706", phase:"Ignite"    },
  { id:"I11", label:"Power Utility",    color:"#C2410C", phase:"Ignite"    },
  { id:"I12", label:"Oil & Gas",        color:"#7C3AED", phase:"Ignite"    },
  { id:"I13", label:"Financial Svcs",   color:"#0891B2", phase:"Ignite"    },
  { id:"I14", label:"Telco Infra",      color:"#1D4ED8", phase:"Ignite"    },
];

export const MEMBERS: Member[] = [
  { id:1,  name:"Forest Interactive",      cat:"platform",   tagline:"Digital ecosystems for telecom across SEA and emerging markets",             services:["Mobile AI","Telecom platforms","Digital content"],   verified:true, featured:true,  engines:["I3","I7","I10","I14"], zone:"gkv", mbm:true  },
  { id:2,  name:"AICHAT",                  cat:"platform",   tagline:"Conversational AI and voice agents for enterprise customer engagement",       services:["Chatbots","Voice AI","AI agents"],                    verified:true,                 engines:["I3","I4","I7","I10"], zone:"gkv", mbm:true  },
  { id:3,  name:"iNextLabs",               cat:"platform",   tagline:"Generative AI and agentic automation solutions for business",                 services:["GenAI solutions","AI agents","Automation"],            verified:true, featured:true,  engines:["I3","I4","I7","I10"], zone:"gkv", mbm:true  },
  { id:4,  name:"Innov8tif (eKYC)",        cat:"platform",   tagline:"AI-powered digital identity verification and eKYC",                          services:["eKYC","Facial recognition","Document AI"],            verified:true,                 engines:["I3","I13"],            zone:"gkv", mbm:true  },
  { id:5,  name:"IFCA MSC",                cat:"platform",   tagline:"AI enterprise software for property and construction sectors",                services:["AI ERP","Property tech","Hospitality AI"],            verified:true,                 engines:["I8"],                  zone:"gkv"            },
  { id:6,  name:"Cyclone Robotics",        cat:"platform",   tagline:"Intelligent automation and RPA solutions for enterprise",                    services:["RPA","Intelligent automation","AI bots"],             verified:true,                 engines:["I2","I4","I8"],        zone:"gkv"            },
  { id:7,  name:"Catalyst Edge AI",        cat:"si",         tagline:"AI strategy consultancy and implementation for mid-market businesses",        services:["AI strategy","Deployment","Change management"],       verified:true,                 engines:["I4","I8","I10"],       zone:"gkv"            },
  { id:8,  name:"DXC Technology",          cat:"si",         tagline:"Global AI transformation services for enterprise and government clients",      services:["AI transformation","IT services","Cloud migration"],  verified:true, featured:true,  engines:["I1","I4","I8","I12"], zone:"gkv"            },
  { id:9,  name:"Mesinaga",                cat:"si",         tagline:"Malaysia leading IT systems integrator - AI-enabled solutions",               services:["System integration","AI solutions","Managed IT"],     verified:true,                 engines:["I2","I4","I8"],        zone:"gkv"            },
  { id:10, name:"CTC Global",              cat:"si",         tagline:"IT infrastructure and AI integration services across Malaysia",               services:["IT infrastructure","AI integration","Managed IT"],    verified:true,                 engines:["I2","I8","I11"],       zone:"gkv"            },
  { id:11, name:"Alibaba Cloud",           cat:"cloud",      tagline:"Cloud AI platform with strong Southeast Asia presence and capability",        services:["Cloud AI","Big data","ML platform"],                  verified:true, featured:true,  engines:["I1","I6","I8","I10"], zone:"gkv"            },
  { id:12, name:"HPE",                     cat:"cloud",      tagline:"Enterprise-grade AI compute and hybrid cloud infrastructure solutions",       services:["AI compute","Hybrid cloud","Edge AI"],                verified:true,                 engines:["I8","I11","I14"],      zone:"gkv"            },
  { id:13, name:"Dell Technologies",       cat:"cloud",      tagline:"End-to-end AI infrastructure and server solutions for enterprise",           services:["AI servers","Storage","Edge compute"],                verified:true,                 engines:["I8","I11"],            zone:"gkv"            },
  { id:14, name:"Intel Technology",        cat:"cloud",      tagline:"Microprocessors and AI hardware enabling intelligent computing at scale",     services:["AI chips","Edge AI","Data centre tech"],              verified:true,                 engines:["I6","I8"],             zone:"gkv"            },
  { id:15, name:"AKATI Sekurity",          cat:"cyber",      tagline:"AI-powered cybersecurity managed services and security operations",           services:["Managed SOC","AI threat detection","Forensics"],      verified:true, featured:true,  engines:["I12","I13"],           zone:"gkv"            },
  { id:16, name:"SecureMetric",            cat:"cyber",      tagline:"Digital identity and AI-enhanced PKI and identity management",               services:["Digital identity","PKI","Identity management"],       verified:true,                 engines:["I3","I13"],            zone:"gkv"            },
  { id:17, name:"Provintell Technologies", cat:"cyber",      tagline:"Cyber SOC and AI-driven threat intelligence and management",                 services:["Cyber SOC","Threat intelligence","SIEM"],             verified:true,                 engines:["I12","I13"],           zone:"gkv"            },
  { id:18, name:"PEOPLElogy Berhad",       cat:"edu",        tagline:"AI upskilling and people development programmes for Malaysian enterprises",   services:["AI literacy","Leadership dev","Digital training"],     verified:true, featured:true,  engines:["I5","I10"],            zone:"gkv"            },
  { id:19, name:"Swinburne University",    cat:"edu",        tagline:"Research-led AI degrees, research partnerships, and talent pipeline",        services:["AI degrees","Research","Talent pipeline"],            verified:true,                 engines:["I5"],                  zone:"ncr"            },
  { id:20, name:"Garranto Academy",        cat:"edu",        tagline:"Professional AI courses and HRDF-claimable technology training programmes",  services:["AI courses","Professional training","HRDF courses"],  verified:true,                 engines:["I5","I10"],            zone:"gkv"            },
  { id:21, name:"Straits Interactive",     cat:"consult",    tagline:"AI governance, data privacy, and responsible AI advisory services",          services:["AI governance","Privacy","Data ethics"],              verified:true,                 engines:["I10","I13"],           zone:"gkv"            },
  { id:22, name:"Innothink Advisory",      cat:"consult",    tagline:"Innovation consultancy and AI strategy for enterprise transformation",        services:["AI strategy","Innovation","Advisory"],                verified:true,                 engines:["I4","I8","I10"],       zone:"gkv"            },
  { id:23, name:"Blacksmith Data",         cat:"consult",    tagline:"AI transformation and analytics advisory - altSHIFT",                        services:["AI transformation","Analytics","Advisory"],           verified:true,                 engines:["I8","I13"],            zone:"gkv"            },
  { id:24, name:"Maxis Broadband",         cat:"telco",      tagline:"Malaysia leading 5G network enabling enterprise AI and connectivity",        services:["5G enterprise","AI-ready networks","IoT"],            verified:true, featured:true,  engines:["I2","I14"],            zone:"gkv"            },
  { id:25, name:"YTL Communications",      cat:"telco",      tagline:"5G connectivity and AI cloud infrastructure via YTL AI Cloud",               services:["5G connectivity","AI cloud","Enterprise networks"],    verified:true,                 engines:["I14"],                 zone:"gkv"            },
  { id:26, name:"Axiata Group",            cat:"telco",      tagline:"Pan-Asian digital telco enabling AI adoption across the region",             services:["Digital telco","AI services","Regional coverage"],    verified:true,                 engines:["I14"],                 zone:"gkv"            },
  { id:27, name:"CyberSecurity Malaysia",  cat:"gov",        tagline:"National cybersecurity agency: policy, standards, AI security guidance",     services:["Policy","Certification","Incident response"],         verified:true,                 engines:["I3","I13"],            zone:"gkv"            },
  { id:28, name:"Cyberview Sdn Bhd",       cat:"gov",        tagline:"Tech ecosystem enabler and hub developer for Malaysia AI industry",          services:["Ecosystem development","Tech hub","Industry dev"],    verified:true,                 engines:["I7"],                  zone:"gkv"            },
];

export const RFPS: RFP[] = [
  { id:1,  title:"AI-powered fraud detection for digital banking",                         sector:"Financial services",  budget:"RM 500K - 1M",    type:"Solution required",    cat:"platform", posted:"2 days ago",   responses:5,  urgent:true,  source:"industry"                },
  { id:2,  title:"Predictive maintenance for semiconductor manufacturing",                  sector:"Manufacturing / E&E", budget:"RM 600K - 1.5M",  type:"Solution required",    cat:"platform", posted:"1 day ago",    responses:3,  urgent:true,  source:"industry"                },
  { id:3,  title:"GenAI customer service chatbot - Bahasa and English",                    sector:"Retail / e-commerce", budget:"RM 150K - 350K",   type:"POC first",            cat:"platform", posted:"5 days ago",   responses:11, urgent:false, source:"industry"                },
  { id:4,  title:"AI literacy programme for 800 government department staff",              sector:"Public sector",       budget:"RM 200K - 500K",   type:"Training programme",   cat:"edu",      posted:"4 days ago",   responses:6,  urgent:false, source:"industry"                },
  { id:5,  title:"Cybersecurity SOC-as-a-Service for hospital group",                     sector:"Healthcare",          budget:"RM 400K - 800K",   type:"Managed service",      cat:"cyber",    posted:"1 week ago",   responses:4,  urgent:false, source:"industry"                },
  { id:6,  title:"HR analytics and AI-powered workforce planning platform",                sector:"Manufacturing",       budget:"RM 250K - 600K",   type:"Solution required",    cat:"si",       posted:"3 days ago",   responses:7,  urgent:false, source:"industry"                },
  { id:7,  title:"I1 AI Diagnostics Platform - Ministry of Health radiology pilot",       sector:"Healthcare",          budget:"RM 2M - 5M",       type:"Solution required",    cat:"platform", posted:"1 week ago",   responses:0,  urgent:true,  source:"government", engine:"I1"  },
  { id:8,  title:"I3 MyGOV AI Citizen Interface - agentic AI pilot (JDN)",               sector:"Public Services",     budget:"RM 3M - 8M",       type:"Solution required",    cat:"platform", posted:"3 days ago",   responses:0,  urgent:true,  source:"government", engine:"I3"  },
  { id:9,  title:"I10 MSME AI Marketplace - SaaS and platform provider onboarding",      sector:"MSMEs",              budget:"Open call",         type:"Vendor registration",  cat:"platform", posted:"5 days ago",   responses:0,  urgent:false, source:"government", engine:"I10" },
  { id:10, title:"E7 AI Growth Zone - Compute-ready AI venture support (MDEC)",          sector:"Cross-sector",        budget:"Compute credits",   type:"Programme application",cat:"consult",  posted:"2 weeks ago",  responses:0,  urgent:false, source:"government", engine:"E7"  },
  { id:11, title:"I8 Manufacturing AI Hub - semiconductor AI model co-development",       sector:"Manufacturing / E&E", budget:"RM 1M - 3M",       type:"Co-development",       cat:"si",       posted:"1 week ago",   responses:0,  urgent:false, source:"government", engine:"I8"  },
];

export const ARTICLES: Article[] = [
  { id:1,  src:"Anthropic",     logo:"An", color:"#CC785C", title:"Anthropic Economic Index: AI effects on the labour market",       desc:"The clearest picture yet of how AI is incorporated into real-world tasks - based on millions of Claude interactions across the economy.",date:"Mar 2025", tag:"Economic impact", url:"https://www.anthropic.com/economic-index", min:15, essential:true  },
  { id:2,  src:"Anthropic",     logo:"An", color:"#CC785C", title:"What 81,000 people want from AI",                                 desc:"The largest multilingual qualitative study of how people actually use AI.",date:"Mar 2026", tag:"Societal impacts", url:"https://www.anthropic.com/research", min:12 },
  { id:3,  src:"OpenAI",        logo:"Oa", color:"#10A37F", title:"OpenAI approach to safety and alignment",                         desc:"OpenAI safety framework 2025.",date:"2025", tag:"AI safety", url:"https://openai.com/research/", min:10 },
  { id:4,  src:"Stanford HAI",  logo:"St", color:"#8C1515", title:"2026 AI Index Report: AI is accelerating",                        desc:"Global adoption reached 88%.",date:"Apr 2026", tag:"State of AI", url:"https://hai.stanford.edu/ai-index/2026-ai-index-report", min:30, essential:true },
  { id:5,  src:"McKinsey",      logo:"Mc", color:"#001E62", title:"The State of AI: Global Survey 2026",                             desc:"64% say AI enables innovation.",date:"Mar 2026", tag:"Enterprise AI", url:"https://www.mckinsey.com", min:18, essential:true },
  { id:6,  src:"KPMG Malaysia", logo:"KP", color:"#00338D", title:"From capacity to capability: Malaysia AI governance imperative",   desc:"AI Governance Bill and AI Malaysia Bhd.",date:"Apr 2026", tag:"Malaysia", url:"https://kpmg.com/my/en/insights/2026/04/from-capacity-to-capability-my-ai-governance-imperative.html", min:10, essential:true },
  { id:7,  src:"AI Malaysia",   logo:"AM", color:"#38A9E0", title:"National AI Action Plan 2026-2030",                               desc:"28 initiatives for AI Nation by 2030.",date:"Jul 2026", tag:"Malaysia", url:"https://www.ai.gov.my", min:8, essential:true },
];

export const JOBS: Job[] = [
  { id:1, title:"AI Solutions Architect",      co:"DXC Technology",    cat:"si",       type:"Full-time", loc:"Kuala Lumpur",   sal:"RM 12K-18K/mo", posted:"3 days ago" },
  { id:2, title:"Machine Learning Engineer",   co:"Alibaba Cloud",     cat:"cloud",    type:"Full-time", loc:"Petaling Jaya",  sal:"RM 10K-15K/mo", posted:"1 week ago" },
  { id:3, title:"Generative AI Consultant",    co:"Catalyst Edge AI",  cat:"consult",  type:"Full-time", loc:"Kuala Lumpur",   sal:"RM 9K-14K/mo",  posted:"5 days ago" },
  { id:4, title:"AI Product Manager",          co:"iNextLabs",         cat:"platform", type:"Full-time", loc:"Remote / KL",    sal:"RM 11K-16K/mo", posted:"2 days ago" },
];

export const COURSES: Course[] = [
  { id:1, title:"Generative AI for Enterprise Leaders",    provider:"PEOPLElogy Berhad",   dur:"2 days",   cert:"NAIO Certified",        hrd:true,  level:"Executive"    },
  { id:2, title:"AI Governance and Ethics Practitioner",   provider:"Straits Interactive",  dur:"3 days",   cert:"PIKOM Endorsed",        hrd:true,  level:"Professional" },
  { id:3, title:"Machine Learning Engineering Bootcamp",   provider:"Swinburne University", dur:"8 weeks",  cert:"University Certificate",hrd:true,  level:"Technical"    },
];

export const POLICIES: Policy[] = [
  { id:1,  title:"AI Governance Bill",                         body:"Ministry of Digital",        status:"In consultation",  sc:"#B45309", due:"End 2026",       urgent:true,  desc:"Risk-based AI legislation open for public consultation. PIKOM has submitted formal position.",             phase:"Catalytic" },
  { id:2,  title:"BNM AI in Financial Services Guidelines",    body:"Bank Negara Malaysia",       status:"Active",           sc:"#065F46", due:"Ongoing",        urgent:false, desc:"Regulatory expectations for AI in banking and insurance.",                                               phase:"Active"    },
  { id:3,  title:"National AI Action Plan 2026-2030",          body:"AI Malaysia (NAIO)",         status:"Published",        sc:"#065F46", due:"Active",         urgent:false, desc:"28 initiatives across 14 Impact Engines and 14 Foundational Enablers. Full text at ai.gov.my.",           phase:"Ignite"    },
  { id:4,  title:"E13 National AI Classification",             body:"AI Malaysia (NAIO)",         status:"Drafting",         sc:"#0369A1", due:"Q2 2027",        urgent:false, desc:"Made-by-Malaysia AI certification. Certified companies get government procurement preference.",          phase:"Ignite"    },
  { id:5,  title:"I10 MSME AI Marketplace",                   body:"MDEC",                       status:"Ignite phase",     sc:"#D97706", due:"End 2026",       urgent:true,  desc:"Vendor onboarding open for 1.5M MSME AI tools marketplace. PIKOM members can apply now.",               phase:"Ignite"    },
  { id:6,  title:"E7 AI Growth Zones Programme",              body:"MDEC / State Authorities",   status:"Catalytic",        sc:"#BE123C", due:"Active",         urgent:true,  desc:"6 regional zones with compute credits, Talent-in-Residence, and milestone incentives. Apply via MDEC.", phase:"Catalytic" },
  { id:7,  title:"E2 National Skilling Marketplace",          body:"TalentCorp / MoHR",          status:"In development",   sc:"#B45309", due:"Q1 2027",        urgent:false, desc:"AI skilling credits for at-risk workers. Approved provider list upcoming - PIKOM courses eligible.",   phase:"Ignite"    },
  { id:8,  title:"E9 National Data Exchange",                 body:"JDN / Ministry of Digital",  status:"Ignite phase",     sc:"#0F766E", due:"Q2 2027",        urgent:false, desc:"AI Data Champion label for companies contributing datasets. Label feeds into Bursa ESG score.",         phase:"Ignite"    },
  { id:9,  title:"E12 AI Trust Function",                     body:"Ministry of Digital",        status:"Establishing",     sc:"#DC2626", due:"2027",           urgent:false, desc:"National AI risk evaluation and accredited assessor scheme. Cybersecurity members can apply.",          phase:"Ignite"    },
  { id:10, title:"I7 Cross-Sector Local AI Ecosystem",        body:"JDN / Ministry of Digital",  status:"Ignite phase",     sc:"#4338CA", due:"2027-2028",      urgent:false, desc:"Made-by-Malaysia AI stack: local datasets, indigenous models, secure compute. Open to platform members.",phase:"Ignite"    },
  { id:11, title:"PDPA AI Amendments",                        body:"PDPC / Ministry of Digital", status:"Under review",     sc:"#7C3AED", due:"2027",           urgent:false, desc:"Updates to Personal Data Protection Act addressing AI-generated data and profiling requirements.",      phase:"Pending"   },
  { id:12, title:"E14 AI-Aware Stewardship (MCCG Update)",   body:"Securities Commission",      status:"Upcoming",         sc:"#374151", due:"2028 target",    urgent:false, desc:"30% of large PLCs to have AI governance statements by 2028, 50% by 2030. Prepare boards now.",        phase:"Pending"   },
];

export const FORUMS: Forum[] = [
  { id:"fin", name:"AI in Financial Services", posts:47, members:32, last:"2 hours ago", hot:true },
  { id:"sme", name:"AI for SMEs",              posts:55, members:41, last:"1 hour ago",  hot:true },
  { id:"agt", name:"Agentic AI SIG",           posts:38, members:26, last:"30 min ago",  hot:true },
];

export const EVENTS: PortalEvent[] = [
  { id:1, title:"PIKOM AI Chapter - Members Meet Q4 2026", day:"18", month:"Oct", type:"inperson", loc:"KLCC - 120 seats" },
  { id:2, title:"Agentic AI SIG: Live Demo and Peer Review", day:"25", month:"Sep", type:"virtual", loc:"Online" },
  { id:3, title:"AI Governance Bill - Member Briefing", day:"30", month:"Sep", type:"hybrid", loc:"PIKOM HQ + Online"},
];

export function catFor(id: string): Category {
  return CATS.find((c) => c.id === id) || CATS[0];
}

export function getInitials(name: string): string {
  return name.replace(/[()&.,]/g, "").split(/\s+/).filter(Boolean).slice(0,2).map((w) => w[0]).join("").toUpperCase();
}
