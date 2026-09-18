/**
 * Single source of truth for everything about Awais that is not a project.
 * Consumed by the home page sections, the resume page, SEO metadata and the
 * chatbot system prompt (src/data/chat-knowledge.ts).
 */

export const profile = {
  name: "Awais Asghar",
  firstName: "Awais",
  headline: "Electrical engineer building AI at the edge",
  tagline:
    "FPGA accelerators, computer vision and LLM applications. I take models from a notebook to real hardware, and ship the software around them.",
  location: "Islamabad, Pakistan",
  recentLocation: "Victoria, BC, Canada (Mitacs Globalink, summer 2026)",
  email: "aasghar.bee22seecs@seecs.edu.pk",
  links: {
    github: "https://github.com/Awais-Asghar",
    linkedin: "https://www.linkedin.com/in/awais--asghar",
    email: "mailto:aasghar.bee22seecs@seecs.edu.pk",
  },
  avatar: "/images/avatar.jpg",
  resumes: [
    {
      id: "ai",
      label: "AI Engineer resume",
      file: "/resume/Awais_Asghar_AI_Engineer.pdf",
      note: "Machine learning, computer vision and LLM work. Best for AI and research roles.",
    },
    {
      id: "hardware",
      label: "Hardware / EE resume",
      file: "/resume/Awais_Asghar_Hardware.pdf",
      note: "FPGA, RTL and embedded systems work. Best for hardware and chip design roles.",
    },
  ],
  openTo: [
    "AI / ML engineering roles",
    "Research positions in ML, computer vision or edge AI",
    "Graduate study (MS / PhD) in machine learning or hardware acceleration",
    "Remote work or relocation, including Canada",
  ],
  about: [
    "I graduated in 2026 with a BE in Electrical Engineering from NUST, Islamabad, with a 3.63 CGPA and a 3.94 GPA in my specialization. My final year project was an FPGA hardware accelerator for real-time image segmentation: a custom U-Net compressed 56 times, quantized to INT8, and run on a Zybo Z7-20 at under 3 W.",
    "Most of my work lives where machine learning meets constrained hardware. I have trained segmentation and classification models, deployed classical vision on a Jetson Nano, written RISC-V processors in SystemVerilog, and built RTOS firmware on STM32. Lately I have been shipping LLM products too: a RAG exam generator, a chat backend on Vercel, and a receipt-reading ledger app.",
    "In summer 2026 I was a Mitacs Globalink research intern at the NRC Herzberg Astronomy and Astrophysics Research Centre in Victoria, Canada, training a spatiotemporal network to find faint Trans-Neptunian Objects in telescope image sequences.",
  ],
  interests: [
    "Machine Learning",
    "Deep Learning",
    "Computer Vision",
    "Generative AI",
    "LLMs & RAG",
    "Agentic AI",
    "Edge AI & FPGA acceleration",
    "Data Science",
  ],
  education: [
    {
      school: "National University of Sciences & Technology (NUST)",
      degree: "BE Electrical Engineering",
      location: "Islamabad, Pakistan",
      period: "Sept 2022 – June 2026",
      details: [
        "CGPA 3.63 / 4.0, specialization GPA 3.94 / 4.0",
        "Merit scholarship 2024–2026, Dean's Honor List five times",
        "Senior design thesis: ML-based hardware accelerator for real-time image segmentation on FPGA",
      ],
    },
  ],
  experience: [
    {
      role: "Mitacs Globalink Research Intern",
      org: "NRC Herzberg Astronomy & Astrophysics Research Centre",
      location: "Victoria, BC, Canada",
      period: "Summer 2026",
      supervisor: "Dr. Sébastien Fabbro",
      bullets: [
        "Applied ML research on large astrophysical image datasets: built a variable-frame spatiotemporal U-Net that replaces classical shift-and-stack detection of Trans-Neptunian Objects.",
        "Ran the full research loop on the CANFAR science platform: synthetic object injection with real PSFs, HDF5 data pipelines, training, evaluation and documentation.",
      ],
      tags: ["PyTorch", "Astronomy", "CANFAR", "HDF5"],
    },
    {
      role: "Chip Design Trainee Engineer",
      org: "NUST Chip Design Centre (NCDC)",
      location: "Islamabad, Pakistan",
      period: "Feb 2025 – May 2026",
      supervisor: "Dr. Hammad M. Cheema",
      bullets: [
        "RTL design, simulation and FPGA implementation in SystemVerilog; hands-on with RISC-V, computer architecture, Linux and C.",
        "Implemented single-cycle and 5-stage pipelined RV32I processors with hazard detection and forwarding, verified on Artix-7 at 100 MHz.",
        "Designed a reprogrammable FPGA anti-theft car security system with debounced sensors, siren generation and a fuel-pump interlock.",
      ],
      tags: ["SystemVerilog", "RISC-V", "Vivado", "Quartus"],
    },
    {
      role: "Deep Learning Research Intern",
      org: "Deep Learning Lab, SINES, NUST",
      location: "Islamabad, Pakistan",
      period: "June 2024 – Sept 2024",
      supervisor: "Dr. Jameel Nawaz Malik",
      bullets: [
        "Built and evaluated CNN and transfer-learning models in PyTorch and TensorFlow with CUDA-accelerated training, focused on benchmarking and validation.",
      ],
      tags: ["PyTorch", "TensorFlow", "CUDA"],
    },
    {
      role: "Machine Learning Research Intern",
      org: "HamsanTech, NSTP",
      location: "Islamabad, Pakistan",
      period: "June 2024 – Aug 2024",
      supervisor: "Dr. Nazia Perwaiz",
      bullets: [
        "Built a multi-model skin cancer classification pipeline (XGBoost, AdaBoost, LightGBM, SVM, logistic regression) reaching 91% accuracy and 0.963 AUC from a single RGB image.",
        "Delivered Power BI and Tableau dashboards and exploratory analysis on real industry datasets.",
      ],
      tags: ["Scikit-learn", "XGBoost", "Power BI", "Tableau"],
    },
    {
      role: "Embedded Systems Design Research Intern",
      org: "ESDAC Lab, NUST",
      location: "Islamabad, Pakistan",
      period: "May 2024 – Aug 2024",
      supervisor: "Dr. Usman Zabit",
      bullets: [
        "Developed and deployed Embedded Linux on FPGA and DE1-SoC boards: bootloaders, kernel configuration, GPIO, memory management and real-time processing.",
      ],
      tags: ["Embedded Linux", "DE1-SoC", "Verilog", "Quartus"],
    },
    {
      role: "Robotics & AI Tutor",
      org: "Murabbi, NUST",
      location: "Islamabad, Pakistan",
      period: "Aug 2024",
      supervisor: "Dr. Wajahat Hussain",
      bullets: [
        "Co-led a robotics and AI boot camp using EV3 kits and model training. Students built competition-winning sumo, speed and obstacle-avoiding robots and later presented them to the Prime Minister of Pakistan.",
      ],
      tags: ["Teaching", "Robotics", "Mentoring"],
    },
  ],
  publications: [
    {
      title: "Design of a Novel Lightweight U-Net Architecture for Efficient Semantic Segmentation",
      status: "In progress",
      note: "Based on the FPGA accelerator FYP and CARLA driving-scene segmentation work at NUST SEECS.",
    },
    {
      title: "Real-Time Fabric Defect Detection on Edge Devices Using Classical Computer Vision",
      status: "In progress",
      note: "Multi-method GLCM / FFT / Gabor pipeline with IoU fusion, deployed on Jetson Nano.",
    },
  ],
  honors: [
    {
      title: "Mitacs Globalink Research Internship",
      detail: "Fully funded international research placement at NRC Herzberg, Canada, summer 2026.",
      year: "2026",
    },
    {
      title: "Millennium Fellowship (Class of 2025)",
      detail: "Selected among the top 4% globally by the UN Academic Impact and Millennium Campus Network.",
      year: "2025",
    },
    {
      title: "NUST SEECS Merit Scholarship",
      detail: "Awarded for academic performance, 2024–2026.",
      year: "2024",
    },
    {
      title: "Dean's Honor List",
      detail: "Recognized five times for outstanding academic performance.",
      year: "2022–2026",
    },
    {
      title: "Prime Minister Youth Laptop Scheme",
      detail: "Merit-based award for academic excellence.",
      year: "2025",
    },
    {
      title: "3rd place, BISE Multan Pre-Engineering",
      detail: "Ranked third among 70,000+ students.",
      year: "2022",
    },
    {
      title: "Intermediate Scholarship",
      detail: "100% fee waiver for academic excellence.",
      year: "2020",
    },
  ],
  leadership: [
    {
      title: "Millennium Fellow, BreatheSafe Initiative",
      org: "UN Academic Impact & Millennium Campus Network",
      detail:
        "Leading a community project that deploys low-cost air quality monitors for dust, smoke and harmful gases, to protect vulnerable populations and push for cleaner air.",
    },
    {
      title: "Director Outreach",
      org: "Google Developer Solution Club, NUST",
      detail: "Ran outreach and partnerships for student developer events.",
    },
    {
      title: "Co-founder, Robotics & AI training startup",
      org: "Student-led",
      detail:
        "Trained students in AI and robotics; boot-camp graduates presented their projects to the Prime Minister of Pakistan.",
    },
  ],
  skills: [
    {
      group: "Machine learning & AI",
      items: ["Python", "PyTorch", "TensorFlow", "Keras", "Scikit-learn", "NumPy", "Pandas", "OpenCV", "SciPy", "CUDA"],
    },
    {
      group: "LLMs & RAG",
      items: ["LangChain", "Groq API", "Llama 3", "FAISS", "CrewAI", "Prompt engineering", "Vector search"],
    },
    {
      group: "FPGA & digital design",
      items: ["SystemVerilog", "Verilog", "RISC-V", "Vivado", "Vitis HLS", "Quartus", "ModelSim", "Zybo Z7-20", "Artix-7", "DE1-SoC"],
    },
    {
      group: "Embedded systems",
      items: ["STM32", "ESP32", "FreeRTOS", "Arduino / AVR", "Jetson Nano", "Pixhawk", "Embedded C", "UART / I2C / SPI"],
    },
    {
      group: "Languages",
      items: ["Python", "C / C++", "Embedded C", "TypeScript", "MATLAB / Simulink", "Assembly", "CUDA"],
    },
    {
      group: "Data & tools",
      items: ["Power BI", "Tableau", "Excel", "Matplotlib", "Seaborn", "Git / GitHub", "Linux", "Jupyter", "LaTeX", "Vercel"],
    },
  ],
  coursework: [
    { title: "Machine Learning Specialization (3 courses)", provider: "DeepLearning.AI" },
    { title: "Deep Learning Specialization (5 courses)", provider: "DeepLearning.AI" },
    { title: "Introduction to Deep Learning, 6.S191", provider: "MIT" },
    { title: "Advanced Python Programming", provider: "Udemy" },
    {
      title:
        "Machine Learning, Deep Learning, Computer Vision, Computer Architecture, Digital System Design, DSP, Embedded System Design, Control Systems, RISC-V, Linux",
      provider: "NUST & NCDC coursework",
    },
  ],
  /** Tools shown in the hero marquee. Order matters visually. */
  marquee: [
    "PyTorch",
    "TensorFlow",
    "OpenCV",
    "SystemVerilog",
    "RISC-V",
    "Vivado",
    "STM32",
    "FreeRTOS",
    "Jetson Nano",
    "LangChain",
    "FAISS",
    "Groq",
    "CUDA",
    "Scikit-learn",
    "Next.js",
    "MATLAB",
    "ESP32",
    "Zybo Z7-20",
    "Python",
    "C/C++",
  ],
} as const;

export type Profile = typeof profile;
