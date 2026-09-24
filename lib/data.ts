import type { Category, Member, RFP, Article, Job, Course, Policy, Forum, PortalEvent } from "./types";

export const CATS: Category[] = [
  { id:"all",       label:"All members",        color:"#38A9E0", count:157 },
  { id:"platform",  label:"AI Platform",         color:"#4338CA", count:26  },
  { id:"si",        label:"SI & Solutions",      color:"#0369A1", count:39  },
  { id:"cloud",     label:"Cloud & Infra",       color:"#0F766E", count:16  },
  { id:"cyber",     label:"Cybersecurity",       color:"#BE123C", count:8   },
  { id:"edu",       label:"Education & Talent",  color:"#B45309", count:11  },
  { id:"consult",   label:"Consultancy",         color:"#065F46", count:13  },
  { id:"enterprise",label:"Enterprise CIOs",     color:"#5B21B6", count:34  },
  { id:"gov",       label:"Government",          color:"#92400E", count:4   },
  { id:"telco",     label:"Telecom",             color:"#1E40AF", count:6   },
];

export const MEMBERS: Member[] = [
  { id:1,  name:"Forest Interactive",      cat:"platform",  tagline:"Digital ecosystems for telecom across SEA and emerging markets",           services:["Mobile AI","Telecom platforms","Digital content"],    verified:true, featured:true  },
  { id:2,  name:"AICHAT",                 cat:"platform",  tagline:"Conversational AI and voice agents for enterprise customer engagement",      services:["Chatbots","Voice AI","AI agents"],                   verified:true                },
  { id:3,  name:"iNextLabs",              cat:"platform",  tagline:"Generative AI and agentic automation solutions for business",                services:["GenAI solutions","AI agents","Automation"],           verified:true, featured:true  },
  { id:4,  name:"Innov8tif (eKYC)",       cat:"platform",  tagline:"AI-powered digital identity verification and eKYC",                         services:["eKYC","Facial recognition","Document AI"],            verified:true                },
  { id:5,  name:"IFCA MSC",               cat:"platform",  tagline:"AI enterprise software for property and construction sectors",              services:["AI ERP","Property tech","Hospitality AI"],            verified:true                },
  { id:6,  name:"Cyclone Robotics",       cat:"platform",  tagline:"Intelligent automation and RPA solutions for enterprise",                   services:["RPA","Intelligent automation","AI bots"],             verified:true                },
  { id:7,  name:"Catalyst Edge AI",       cat:"si",        tagline:"AI strategy consultancy and implementation for mid-market businesses",      services:["AI strategy","Deployment","Change management"],       verified:true                },
  { id:8,  name:"DXC Technology",         cat:"si",        tagline:"Global AI transformation services for enterprise and government clients",   services:["AI transformation","IT services","Cloud migration"],  verified:true, featured:true  },
  { id:9,  name:"Mesiniaga",              cat:"si",        tagline:"Malaysia's leading IT systems integrator â AI-enabled solutions",           services:["System integration","AI solutions","Managed IT"],     verified:true                },
  { id:10, name:"CTC Global",             cat:"si",        tagline:"IT infrastructure and AI integration services across Malaysia",             services:["IT infrastructure","AI integration","Managed IT"],    verified:true                },
  { id:11, name:"Alibaba Cloud",          cat:"cloud",     tagline:"Cloud AI platform with strong Southeast Asia presence and capability",      services:["Cloud AI","Big data","ML platform"],                  verified:true, featured:true  },
  { id:12, name:"HPE",                    cat:"cloud",     tagline:"Enterprise-grade AI compute and hybrid cloud infrastructure solutions",     services:["AI compute","Hybrid cloud","Edge AI"],                verified:true                },
  { id:13, name:"Dell Technologies",      cat:"cloud",     tagline:"End-to-end AI infrastructure and server solutions for enterprise",         services:["AI servers","Storage","Edge compute"],                 verified:true                },
  { id:14, name:"Intel Technology",       cat:"cloud",     tagline:"Microprocessors and AI hardware enabling intelligent computing at scale",   services:["AI chips","Edge AI","Data centre tech"],              verified:true                },
  { id:15, name:"AKATI Sekurity",         cat:"cyber",     tagline:"AI-powered cybersecurity managed services and security operations",        services:["Managed SOC","AI threat detection","Forensics"],      verified:true, featured:true  },
  { id:16, name:"SecureMetric",           cat:"cyber",     tagline:"Digital identity and AI-enhanced PKI and identity management",             services:["Digital identity","PKI","Identity management"],       verified:true                },
  { id:17, name:"Provintell Technologies",cat:"cyber",     tagline:"Cyber SOC and AI-driven threat intelligence and management",               services:["Cyber SOC","Threat intelligence","SIEM"],             verified:true                },
  { id:18, name:"PEOPLElogy Berhad",     cat:"edu",       tagline:"AI upskilling and people development programmes for Malaysian enterprises", services:["AI literacy","Leadership dev","Digital training"],    verified:true, featured:true  },
  { id:19, name:"Swinburne University",   cat:"edu",       tagline:"Research-led AI degrees, research partnerships, and talent pipeline",      services:["AI degrees","Research","Talent pipeline"],            verified:true                },
  { id:20, name:"Garranto Academy",       cat:"edu",       tagline:"Professional AI courses and HRDF-claimable technology training programmes",services:["AI courses","Professional training","HRDF courses"],  verified:true                },
  { id:21, name:"Straits Interactive",    cat:"consult",   tagline:"AI governance, data privacy, and responsible AI advisory services",        services:["AI governance","Privacy","Data ethics"],              verified:true                },
  { id:22, name:"Innothink Advisory",     cat:"consult",   tagline:"Innovation consultancy and AI strategy for enterprise transformation",     services:["AI strategy","Innovation","Advisory"],                verified:true                },
  { id:23, name:"Blacksmith Data",        cat:"consult",   tagline:"AI transformation and analytics advisory â altSHIFT",                    services:["AI transformation","Analytics","Advisory"],           verified:true                },
  { id:24, name:"Maxis Broadband",        cat:"telco",     tagline:"Malaysia's leading 5G network enabling enterprise AI and connectivity",    services:["5G enterprise","AI-ready networks","IoT"],            verified:true, featured:true  },
  { id:25, name:"YTL Communications",    cat:"telco",     tagline:"5G connectivity and AI cloud infrastructure via YTL AI Cloud",             services:["5G connectivity","AI cloud","Enterprise networks"],   verified:true                },
  { id:26, name:"Axiata Group",           cat:"telco",     tagline:"Pan-Asian digital telco enabling AI adoption across the region",           services:["Digital telco","AI services","Regional coverage"],    verified:true                },
  { id:27, name:"CyberSecurity Malaysia", cat:"gov",       tagline:"National cybersecurity agency: policy, standards, AI security guidance",  services:["Policy","Certification","Incident response"],         verified:true                },
  { id:28, name:"Cyberview Sdn Bhd",     cat:"gov",       tagline:"Tech ecosystem enabler and hub developer for Malaysia's AI industry",     services:["Ecosystem development","Tech hub","Industry dev"],    verified:true                },
];

export const RFPS: RFP[] = [
  { id:1, title:"AI-powered fraud detection for digital banking",            sector:"Financial services",  budget:"RM 500K â 1M",   type:"Solution required",  cat:"platform", posted:"2 days ago",  responses:5,  urgent:true  },
  { id:2, title:"Predictive maintenance for semiconductor manufacturing",     sector:"Manufacturing / E&E", budget:"RM 600K â 1.5M", type:"Solution required",  cat:"platform", posted:"1 day ago",   responses:3,  urgent:true  },
  { id:3, title:"GenAI customer service chatbot â Bahasa and English",       sector:"Retail / e-commerce", budget:"RM 150K â 350K", type:"POC first",           cat:"platform", posted:"5 days ago",  responses:11, urgent:false },
  { id:4, title:"AI literacy programme for 800 government department staff", sector:"Public sector",       budget:"RM 200K â 500K", type:"Training programme",  cat:"edu",      posted:"4 days ago",  responses:6,  urgent:false },
  { id:5, title:"Cybersecurity SOC-as-a-Service for hospital group",         sector:"Healthcare",          budget:"RM 400K â 800K", type:"Managed service",     cat:"cyber",    posted:"1 week ago",  responses:4,  urgent:false },
  { id:6, title:"HR analytics and AI-powered workforce planning platform",   sector:"Manufacturing",       budget:"RM 250K â 600K", type:"Solution required",   cat:"si",       posted:"3 days ago",  responses:7,  urgent:false },
];

export const ARTICLES: Article[] = [
  { id:1,  src:"Anthropic",       logo:"An", color:"#CC785C", title:"Anthropic Economic Index: AI's effects on the labour market",          desc:"The clearest picture yet of how AI is incorporated into real-world tasks â based on millions of Claude interactions across the economy.",date:"Mar 2025", tag:"Economic impact", url:"https://www.anthropic.com/economic-index", min:15, essential:true  },
  { id:2,  src:"Anthropic",       logo:"An", color:"#CC785C bôle:"What 81,000 people want from AI", desc:"The largest multilingual qualitative study of how people actually use AI.",date:"Mar 2026", tag:"Societal impacts", url:"https://www.anthropic.com/research", min:12 },
  { id:3,  src:"OpenAI", logo:"Oa", color:"#10A37F", title:"OpenAI's approach to safety and alignment", desc:"OpenAI-s safety framework2025.",date:"2025", tag:"AI safety", url:"https://openai.com/research/", min:10 },
  { id:4,  src:"Stanford HAI", logo:"St", color:"#8C1515", title:"2026 AI Index Report: AI is accelerating", desc:"Global adoption reached 88%.",date:"Apr 2026", tag:"State of AI", url:"https://hai.stanford.edu/ai-index/2026-ai-index-report", min:30, essential:true },
  { id:5,  src:"McKinsey", logo:"Mc", color:"#001E62", title:"The State of AI: Global Survey 2026", desc:"64% say AI enables innovation.",date:"Mar 2026", tag:"Enterprise AI", url:"https://www.mckinsey.com", min:18, essential:true },
  { id:6,  src:"KPMG Malaysia", logo:"KP", color:"#00338D", title:"From capacity to capability: Malaysia's AI governance imperative", desc:"AI Governance Bill and AI Malaysia Bhd.",date:"Apr 2026", tag:"Malaysia", url:"https://kpmg.com/my/en/insights/2026/04/from-capacity-to-capability-my-ai-governance-imperative.html", min:10, essential:true },
  { id:7,  src:"AI Malaysia", logo:"AM", color:"#38A9E0", title:"National AI Action Plan 2026â2030", desc:"28 initiatives for AI Nation by 2030.",date:"Jul 2026", tag:"Malaysia", url:"https://www.ai.gov.my", min:8, essential:true },
];

export const JOBS: Job[] = [
  { id:1, title:"AI Solutions Architect", co:"DXC Technology", cat:"si", type:"Full-time", loc:"Kuala Lumpur", sal:"RM 12Kâ18K/mo", posted:"3 days ago" },
  { id:2, title:"Machine Learning Engineer", co:"Alibaba Cloud", cat:"cloud", type:"Full-time", loc:"Petaling Jaya", sal:"RM 10Kâ15K/mo", posted:"1 week ago" },
  { id:3, title:"Generative AI Consultant", co:"Catalyst Edge AI", cat:"consult", type:"Full-time", loc:"Kuala Lumpur", sal:"RM 9Kâ14K/mo", posted:"5 days ago" },
  { id:4, title:"AI Product Manager", co:"iNextLabs", cat:"platform", type:"Full-time", loc:"Remote / KL", sal:"RM 11Kâ16K/mo", posted:"2 days ago" },
];

export const COURSES: Course[] = [
  { id:1, title:"Generative AI for Enterprise Leaders", provider:"PEOPLElogy Berhad", dur:"2 days", cert:"NAIO Certified", hrd:true, level:"Executive" },
  { id:2, title:"AI Governance and Ethics Practitioner", provider:"Straits Interactive", dur:"3 days", cert:"PIKOM Endorsed", hrd:true, level:"Professional" },
  { id:3, title:"Machine Learning Engineering Bootcamp", provider:"Swinburne University", dur:"8 weeks", cert:"University Certificate", hrd:true, level:"Technical" },
];

export const POLICIES: Policy[] = [
  { id:1, title:"AI Governance Bill", body:"Ministry of Digital", status:"In consultation", sc:"#B45309", due:"End 2026", urgent:true, desc:"Risk-based AI legislation open for public consultation." },
  { id:2, title:"BNM AI in Financial Services Guidelines", body:"Bank Negara Malaysia", status:"Active", sc:"#065F46", due:"Ongoing", urgent:false, desc:"Regulatory expectations for AI in banking and insurance." },
  { id:3, title:"National AI Action Plan 2026â2030", body:"AI Malaysia", status:"Published", sc:"#065F46", due:"Active", urgent:false, desc:"28 initiatives across sector application and capability building." },
];

export const FORUMS: Forum[] = [
  { id:"fin", name:"AI in Financial Services", posts:47, members:32, last:"2 hours ago", hot:true },
  { id:"sme", name:"AI for SMEs", posts:55, members:41, last:"1 hour ago", hot:true },
  { id:"agt", name:"Agentic AI SIG", posts:38, members:26, last:"30 min ago", hot:true },
];

export const EVENTS: PortalEvent[] = [
  { id:1, title:"PIKOM AI Chapter â Members Meet Q4 2026", day:"18", month:"Oct", type:"inperson", loc:"KLCC Â· 120 seats" },
  { id:2, title:"Agentic AI SIG: Live Demo and Peer Review", day:"25", month:"Sep", type:"virtual", loc:"Online" },
  { id:3, title:"AI Governance Bill â Member Briefing", day:"30", month:"Sep", type:"hybrid", loc:"PIKOM HQ + Online"},
];

export function catFor(id: string): Category {
  return CATS.find((c) => c.id === id) || CATS[0];
}

export function getInitials(name: string): string {
  return name.replace(/[()&.,]/g, "").split(/\s+/).filter(Boolean).slice(0,2).map((w) => w[0]).join("").toUpperCase();
}
