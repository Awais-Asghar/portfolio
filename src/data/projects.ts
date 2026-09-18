import type { CategoryId, Motif } from "./categories";

export interface Metric {
  value: string;
  label: string;
}

export interface Project {
  /** URL slug: /projects/<slug>. Also the thumbnail file name. */
  slug: string;
  /** GitHub repository name under Awais-Asghar. */
  repo: string;
  title: string;
  /** One line, shown on cards. */
  tagline: string;
  /** Two or three sentences, shown on the detail page. */
  summary: string;
  category: CategoryId;
  tags: string[];
  tech: string[];
  year: number;
  period?: string;
  live?: string;
  /** Lower number = earlier on the home page. Undefined = not featured. */
  featured?: number;
  /** Repository is private: no README render, no source link. */
  isPrivate?: boolean;
  fork?: { owner: string; note: string };
  metrics?: Metric[];
  /** Thumbnail overrides. Defaults come from the category. */
  motif?: Motif;
  accent?: string;
}

const GH = "https://github.com/Awais-Asghar/";

export const projects: Project[] = [
  // ───────────────────────── Featured ─────────────────────────
  {
    slug: "fpga-unet-accelerator",
    repo: "FPGA-U-Net-Accelerator",
    title: "FPGA U-Net Accelerator",
    tagline: "Real-time semantic segmentation on a Zybo Z7-20 at under 3 W.",
    summary:
      "Final year project: a hardware-software co-design that trains a custom lightweight U-Net, quantizes it to INT8 and deploys it on a Zynq-7000 FPGA for autonomous-driving scene segmentation. The model shrinks 56 times to 570 KB so it fits in on-chip BRAM, while keeping 97% pixel accuracy on the CARLA dataset. The RTL is fully verified and the whole pipeline, from PyTorch training to bitstream, is documented.",
    category: "fpga",
    tags: ["Edge AI", "Segmentation", "Hardware accelerator", "Quantization", "FYP"],
    tech: ["SystemVerilog", "Vivado", "Vitis HLS", "PyTorch", "Python", "Zybo Z7-20", "PYNQ"],
    year: 2026,
    period: "2025 – 2026",
    featured: 1,
    isPrivate: true,
    metrics: [
      { value: "56×", label: "model compression" },
      { value: "97%", label: "pixel accuracy" },
      { value: "2.7 W", label: "board power" },
    ],
    accent: "#1F4E79",
  },
  {
    slug: "pipelined-risc-v",
    repo: "5-Stage-Pipelined-RISC-V-Processor-on-FPGA",
    title: "5-Stage Pipelined RISC-V Processor",
    tagline: "RV32I core with hazard detection and forwarding, running at 100 MHz on Artix-7.",
    summary:
      "A classic five-stage pipeline (IF, ID, EX, MEM, WB) written in SystemVerilog and implemented on a Nexys A7. It supports the full RV32I instruction set with a hazard unit, data forwarding and pipeline registers, and was verified through simulation and on-board tests. Compared with the single-cycle design it delivers roughly four times the throughput.",
    category: "fpga",
    tags: ["Computer architecture", "RISC-V", "Pipelining", "Processor design"],
    tech: ["SystemVerilog", "Vivado", "Nexys A7", "Assembly", "Python"],
    year: 2025,
    featured: 2,
    metrics: [
      { value: "4×", label: "throughput vs single-cycle" },
      { value: "100 MHz", label: "on Artix-7" },
      { value: "RV32I", label: "full ISA" },
    ],
  },
  {
    slug: "exam-generator-rag",
    repo: "AI-Based-Exam-Paper-Generator-using-RAG",
    title: "AI Exam Paper Generator (RAG)",
    tagline: "Turns lecture slides into structured exam papers with FAISS retrieval and Llama 3.1.",
    summary:
      "An end-to-end retrieval-augmented generation pipeline: PDF ingestion with PyMuPDF, chunking, sentence-transformer embeddings, FAISS vector search and Groq-hosted Llama 3.1 for question generation. It produces MCQ, true/false, short answer, fill-in-the-blank and descriptive questions with configurable difficulty, and validates every generated item against a schema.",
    category: "llm-rag",
    tags: ["RAG", "LLM", "Vector search", "Education"],
    tech: ["Python", "LangChain", "FAISS", "Groq API", "Llama 3.1", "Sentence Transformers"],
    year: 2026,
    featured: 3,
    metrics: [
      { value: "5", label: "question types" },
      { value: "100%", label: "schema validation pass" },
    ],
  },
  {
    slug: "fabric-defect-detection",
    repo: "Real-Time-Fabric-Defect-Detection-on-Jetson-Nano",
    title: "Real-Time Fabric Defect Detection",
    tagline: "Six classical detectors fused by IoU, running live on a Jetson Nano.",
    summary:
      "A purely classical computer vision system for textile inspection, with no deep learning. GLCM texture statistics, FFT, Gabor filters, statistical variance, background subtraction and edge-Hough analysis each propose candidate regions, and an IoU-based fusion step merges them into stable bounding boxes. The pipeline is optimized for live camera input on a low-power edge device and is the basis of a paper in progress.",
    category: "computer-vision",
    tags: ["Classical CV", "Edge AI", "Industrial inspection", "Paper in progress"],
    tech: ["Python", "OpenCV", "NumPy", "SciPy", "scikit-image", "Jetson Nano"],
    year: 2025,
    featured: 4,
    metrics: [
      { value: "6", label: "independent detectors" },
      { value: "0", label: "neural networks" },
    ],
    accent: "#5B4B8A",
  },
  {
    slug: "driving-scene-segmentation",
    repo: "Autonomous-Driving-Scene-Segmentation-with-U-Net",
    title: "Lightweight U-Net for Driving Scenes",
    tagline: "A U-Net compressed from 8.7M to 0.53M parameters without losing the skip connections.",
    summary:
      "Pixel-wise semantic segmentation of CARLA simulator scenes into road, vehicles, pedestrians, buildings, vegetation and background. The novel lightweight variant keeps the encoder-decoder structure while cutting parameters sixteen-fold, and still reaches 72% IoU, 80% F1 and 96% test accuracy. It became the model family behind the FPGA accelerator.",
    category: "computer-vision",
    tags: ["Segmentation", "Autonomous driving", "Model compression", "Paper in progress"],
    tech: ["Python", "PyTorch", "TensorFlow", "OpenCV", "NumPy", "Kaggle"],
    year: 2025,
    featured: 5,
    metrics: [
      { value: "0.53M", label: "parameters (from 8.7M)" },
      { value: "72%", label: "IoU" },
      { value: "96%", label: "test accuracy" },
    ],
  },
  {
    slug: "smart-energy-monitor",
    repo: "FreeRTOS-Based-Smart-Energy-Monitor-using-STM32",
    title: "FreeRTOS Smart Energy Monitor",
    tagline: "STM32F746 tasks compute Vrms, Irms and kWh; an ESP32 pushes it to a cloud dashboard.",
    summary:
      "A real-time energy monitoring and billing system. Independent FreeRTOS tasks on an STM32F746 handle sensor acquisition from ZMPT101B and ACS712 modules, RMS calculation with DC-offset removal, power and energy computation, and a local display. Processed data goes over UART to an ESP32 that uploads to Firebase for remote monitoring.",
    category: "embedded",
    tags: ["RTOS", "IoT", "Power electronics", "Cloud"],
    tech: ["STM32F746", "FreeRTOS", "ESP32", "C/C++", "IAR Workbench", "Firebase", "UART"],
    year: 2025,
    featured: 6,
    metrics: [
      { value: "3", label: "concurrent RTOS tasks" },
      { value: "Vrms · Irms · kWh", label: "computed on-device" },
    ],
  },
  {
    slug: "tno-detection",
    repo: "tno_detection",
    title: "Trans-Neptunian Object Detection",
    tagline: "A spatiotemporal U-Net that finds faint moving objects in telescope image sequences.",
    summary:
      "Mitacs Globalink research at NRC Herzberg, Victoria. Trans-Neptunian Objects are too faint to see in a single exposure, so the network exploits their slow drift across a sequence of difference images. Synthetic objects rendered with real per-frame PSFs are injected into real data for training; the model accepts a variable number of frames and outputs a dense track map. It replaces the classical shift-and-stack search.",
    category: "ai-ml",
    tags: ["Research", "Astronomy", "Segmentation", "Mitacs"],
    tech: ["PyTorch", "Python", "HDF5", "CANFAR", "Astropy"],
    year: 2026,
    period: "Summer 2026",
    featured: 7,
    isPrivate: true,
    fork: {
      owner: "sfabbro",
      note: "Developed with Dr. Sébastien Fabbro at NRC Herzberg.",
    },
    metrics: [
      { value: "4–20", label: "frames per sequence" },
      { value: "1", label: "set of weights for all lengths" },
    ],
    motif: "segmentation",
    accent: "#2F5F63",
  },
  {
    slug: "cashflow",
    repo: "cashflow",
    title: "CashFlow",
    tagline: "A personal ledger that reads your receipts and keeps borrowed money out of your income.",
    summary:
      "A shipped web app. Photograph a receipt or upload a bank statement and a vision model fills in the entries for review. Eight transaction kinds keep debt and savings separate from income and expenses, balances are summed by Postgres in exact numeric types, and every currency is tracked without conversion. A small chat assistant answers questions about your own records.",
    category: "web",
    tags: ["Product", "LLM vision", "Full-stack", "Supabase"],
    tech: ["Next.js 16", "React 19", "TypeScript", "Tailwind 4", "Supabase", "Groq", "Vercel"],
    year: 2026,
    live: "https://usecashflow.vercel.app",
    featured: 8,
    isPrivate: true,
    metrics: [
      { value: "8", label: "transaction kinds" },
      { value: "160", label: "currencies" },
      { value: "3-tier", label: "receipt reader" },
    ],
    accent: "#0D7355",
  },

  // ───────────────────── AI & Machine Learning ─────────────────────
  {
    slug: "skinsense",
    repo: "SkinSense-Multi-Model-Skin-Cancer-Classifier",
    title: "SkinSense: Skin Cancer Classifier",
    tagline: "An ensemble of five models labels a lesion as benign or malignant from one RGB image.",
    summary:
      "Built during a research internship at HamsanTech. The pipeline covers data cleaning, feature extraction and model ensembling across XGBoost, LightGBM, AdaBoost, SVM and logistic regression, with full exploratory analysis of the image metadata.",
    category: "ai-ml",
    tags: ["Medical imaging", "Ensemble", "Classification"],
    tech: ["Python", "Scikit-learn", "XGBoost", "LightGBM", "PyTorch", "Pandas"],
    year: 2024,
    metrics: [
      { value: "91%", label: "accuracy" },
      { value: "0.963", label: "AUC" },
    ],
  },
  {
    slug: "recyclevision",
    repo: "RecycleVision-Automated-Waste-Classification-using-EfficientlNet",
    title: "RecycleVision",
    tagline: "EfficientNetB0 transfer learning sorts waste into six recyclable categories.",
    summary:
      "An image classifier for smart bins and recycling plants. Transfer learning on EfficientNetB0 with augmentation and careful validation reaches 92.9% test accuracy and a 0.93 macro F1 across cardboard, glass, metal, paper, plastic and trash, while staying light enough for edge deployment.",
    category: "ai-ml",
    tags: ["Transfer learning", "Classification", "Sustainability"],
    tech: ["Python", "TensorFlow", "Keras", "EfficientNetB0", "OpenCV", "Kaggle"],
    year: 2025,
    metrics: [
      { value: "92.9%", label: "test accuracy" },
      { value: "0.93", label: "macro F1" },
    ],
  },
  {
    slug: "cifar100-wideresnet",
    repo: "CIFAR100-WideResNet-Classification-Pipeline",
    title: "CIFAR-100 with WideResNet-28×10",
    tagline: "A reproducible high-accuracy training pipeline with MixUp, CutMix and RandAugment.",
    summary:
      "Trains a WideResNet-28×10 on CIFAR-100 with strong augmentation and a stable schedule, then analyzes the model with top-1 and top-5 accuracy, per-class results and confusion matrices.",
    category: "ai-ml",
    tags: ["Image classification", "Augmentation", "Deep learning"],
    tech: ["Python", "PyTorch", "WideResNet", "NumPy"],
    year: 2025,
    metrics: [{ value: "100", label: "classes" }],
  },
  {
    slug: "outfit-classifier",
    repo: "Outfit-Classifier-using-CNN",
    title: "Outfit Classifier (Fashion-MNIST)",
    tagline: "A from-scratch CNN that recognizes ten clothing categories.",
    summary:
      "A complete classification pipeline on Fashion-MNIST: preprocessing, a compact convolutional network, training curves and evaluation across T-shirts, trousers, dresses, sneakers, bags and more.",
    category: "ai-ml",
    tags: ["CNN", "Classification"],
    tech: ["Python", "PyTorch", "NumPy", "Matplotlib"],
    year: 2025,
    metrics: [{ value: "10", label: "classes" }],
  },
  {
    slug: "banknote-svm",
    repo: "Banknote-Authentication-Using-Linear-SVM",
    title: "Banknote Authentication with a Hand-Coded SVM",
    tagline: "A linear SVM written in pure NumPy that separates genuine notes from counterfeits.",
    summary:
      "No scikit-learn: the training loop, vectorized gradients, metrics and a decision-boundary visualizer are all implemented by hand to make the model fully transparent. It exceeds 99% test accuracy on the banknote authentication dataset.",
    category: "ai-ml",
    tags: ["SVM", "From scratch", "Classification"],
    tech: ["Python", "NumPy", "Matplotlib"],
    year: 2025,
    metrics: [{ value: ">99%", label: "test accuracy" }],
  },
  {
    slug: "shroomsafe",
    repo: "ShroomSafe-Predicting-Mushroom-Toxicity",
    title: "ShroomSafe",
    tagline: "Decision trees and random forests decide whether a mushroom is edible or poisonous.",
    summary:
      "A binary classifier on physical mushroom features where the cost of a false negative is severe. The project compares a single decision tree against a random forest and reports accuracy, F1 and confusion matrices with a focus on precision for the edible class.",
    category: "ai-ml",
    tags: ["Tree models", "Classification", "Safety"],
    tech: ["Python", "Scikit-learn", "Pandas"],
    year: 2025,
    metrics: [{ value: "100%", label: "test accuracy" }],
  },
  {
    slug: "carddefender",
    repo: "CardDefender-Credit-Card-Fraud-Detection-Pipeline",
    title: "CardDefender: Fraud Detection",
    tagline: "A fraud pipeline built for an extremely imbalanced transaction dataset.",
    summary:
      "Handles the class imbalance that makes fraud detection hard: resampling, threshold tuning and models chosen for recall on the fraud class rather than raw accuracy, with a full evaluation of precision, recall and F1.",
    category: "ai-ml",
    tags: ["Imbalanced data", "Classification", "Finance"],
    tech: ["Python", "Scikit-learn", "Pandas", "SMOTE"],
    year: 2025,
  },
  {
    slug: "sentimentflow",
    repo: "SentimentFlow-RNN-and-LSTM-Powered-Tweet-Analysis",
    title: "SentimentFlow",
    tagline: "RNN and LSTM models compared head-to-head on tweet sentiment.",
    summary:
      "Trains a simple recurrent network and an LSTM on the same tweet corpus to classify sentiment as positive or negative, then compares them on accuracy, F1 and confusion matrices.",
    category: "ai-ml",
    tags: ["NLP", "Sequence models", "Deep learning"],
    tech: ["Python", "PyTorch", "NumPy"],
    year: 2025,
    metrics: [{ value: "83%", label: "validation accuracy" }],
  },
  {
    slug: "breastnet",
    repo: "BreastNet-Early-Breast-Cancer-Detection",
    title: "BreastNet",
    tagline: "A neural network for early breast cancer detection from clinical measurements.",
    summary:
      "Classifies tissue samples as benign or malignant from nine numerical features. The project builds the full pipeline: loading, preprocessing, network design, training, evaluation and result visualization.",
    category: "ai-ml",
    tags: ["Medical", "Neural network", "Classification"],
    tech: ["Python", "NumPy", "Keras"],
    year: 2025,
    metrics: [{ value: "0.91", label: "F1 score" }],
  },
  {
    slug: "movie-recommender",
    repo: "Hybrid-Movie-Recommender-System",
    title: "Hybrid Movie Recommender",
    tagline: "Content-based, collaborative and hybrid recommenders for 2015–2025 releases.",
    summary:
      "Collects movie data through APIs and scraping, engineers features, models text with TF-IDF, factorizes the rating matrix and fuses both scores into a hybrid recommender. Includes exploratory analysis and RMSE evaluation for the collaborative model.",
    category: "ai-ml",
    tags: ["Recommender systems", "Data science", "Web scraping"],
    tech: ["Python", "Pandas", "Scikit-learn", "PyTorch"],
    year: 2025,
    metrics: [{ value: "3", label: "recommender strategies" }],
  },
  {
    slug: "music-genre-classifier",
    repo: "DSP-Based-Music-Genre-Classifier",
    title: "DSP Music Genre Classifier",
    tagline: "Handcrafted DSP features plus a mel-spectrogram CNN for real-time genre detection.",
    summary:
      "A hybrid system in MATLAB that combines classical models (KNN, SVM, boosted trees) on DSP features with a CNN on mel-spectrograms, trading off the accuracy of deep learning against the low latency of classical classifiers.",
    category: "ai-ml",
    tags: ["Audio", "DSP", "Ensemble"],
    tech: ["MATLAB", "Signal Processing Toolbox", "CNN"],
    year: 2025,
  },
  {
    slug: "induction-motor-fault-detection",
    repo: "Early-Fault-Detection-for-Induction-Motor-Using-ML",
    title: "Induction Motor Fault Detection",
    tagline: "Simulink motor models plus ML classifiers catch six faults before they cause downtime.",
    summary:
      "Detects eccentricity, overload, stator short circuit, broken rotor bars, ground faults and unbalanced supply. Motor models built in Simulink generate the fault signatures, spectral and time-frequency features are extracted, and KNN and decision-tree classifiers trained in MATLAB's Diagnostic Feature Designer reach 96% accuracy.",
    category: "ai-ml",
    tags: ["Predictive maintenance", "Signal processing", "Simulink"],
    tech: ["MATLAB", "Simulink", "Diagnostic Feature Designer", "Classification Learner"],
    year: 2024,
    metrics: [
      { value: "6", label: "fault types" },
      { value: "96%", label: "classification accuracy" },
    ],
  },

  // ───────────────────────── Computer Vision ─────────────────────────
  {
    slug: "retina-vessel-segmentation",
    repo: "U-Net-Retina-Blood-Vessel-Segmentation",
    title: "Retinal Vessel Segmentation",
    tagline: "A clean, reproducible U-Net pipeline for segmenting blood vessels in fundus images.",
    summary:
      "Pairs fundus images with vessel masks, trains a U-Net in PyTorch and visualizes predicted vessel maps. Accurate vessel segmentation supports early diagnosis of diabetic retinopathy and related conditions.",
    category: "computer-vision",
    tags: ["Medical imaging", "Segmentation", "U-Net"],
    tech: ["Python", "PyTorch", "OpenCV"],
    year: 2025,
  },
  {
    slug: "stereo-depth-estimation",
    repo: "Stereo-Depth-Estimation",
    title: "Stereo Depth Estimation",
    tagline: "Disparity and depth maps from a calibrated stereo pair, with classical vision only.",
    summary:
      "Covers camera and stereo calibration, rectification, disparity computation and conversion to metric depth, explaining each step of how two slightly different viewpoints reveal distance.",
    category: "computer-vision",
    tags: ["3D vision", "Calibration", "Classical CV"],
    tech: ["Python", "OpenCV", "NumPy"],
    year: 2025,
  },
  {
    slug: "vehicle-detection",
    repo: "Vehicle-Detection-and-Counting-System",
    title: "Vehicle Detection & Counting",
    tagline: "YOLOv4 tracks and counts vehicles in live traffic video.",
    summary:
      "My first repository. Real-time detection with pre-trained YOLOv4 weights, non-max suppression and score thresholding, followed by tracking and line-crossing counts for traffic monitoring.",
    category: "computer-vision",
    tags: ["Object detection", "Tracking", "YOLO"],
    tech: ["Python", "OpenCV", "YOLOv4", "PyTorch"],
    year: 2024,
    metrics: [{ value: "90%", label: "detection accuracy" }],
  },

  // ───────────────────────── LLMs, RAG & Agents ─────────────────────────
  {
    slug: "ai-agents-workshop",
    repo: "AI-Agents-From-Idea-to-Deployment",
    title: "AI Agents: From Idea to Deployment",
    tagline: "A CrewAI workshop template with planning, research, writing and review agents.",
    summary:
      "A hands-on template that orchestrates multiple CrewAI agents with LangChain tools, a FAISS-backed RAG pipeline, live web search and deterministic calculators, all behind a Streamlit front end. Built to teach how multi-agent systems are structured end to end.",
    category: "llm-rag",
    tags: ["Agents", "CrewAI", "RAG", "Teaching"],
    tech: ["Python", "CrewAI", "LangChain", "FAISS", "Llama 3", "Streamlit"],
    year: 2025,
    metrics: [{ value: "4", label: "cooperating agents" }],
  },
  {
    slug: "techstore-chatbot",
    repo: "TechStore-Chatbot",
    title: "TechStore Chatbot",
    tagline: "A serverless LLM chat backend for a Pakistani electronics retailer, deployed on Vercel.",
    summary:
      "A minimal, production-focused chatbot backend for techstore.com.pk: one serverless function, secrets kept in the Vercel dashboard, and an embeddable chat window that can drop into the store's WordPress site.",
    category: "llm-rag",
    tags: ["Serverless", "Chatbot", "Deployment"],
    tech: ["JavaScript", "Node.js", "Vercel Functions", "LLM API"],
    year: 2026,
    live: "https://techstore-chatbot.vercel.app/Techbot.html",
  },

  // ───────────────────────── FPGA & Digital Design ─────────────────────────
  {
    slug: "fyp-ai-accelerator",
    repo: "FYP-AI-Accelerator",
    title: "AI Accelerator: Co-Design Pipeline",
    tagline: "The step-by-step hardware-software flow behind the U-Net accelerator on Zybo Z7-20.",
    summary:
      "The engineering companion to the FPGA U-Net accelerator: environment setup, model export, HLS and RTL blocks, and the ARM Cortex-A9 processing-system side of the Zynq-7000 that feeds the programmable logic. Written as a guide so the flow can be reproduced.",
    category: "fpga",
    tags: ["Hardware accelerator", "Zynq", "HLS", "FYP"],
    tech: ["SystemVerilog", "Vitis HLS", "Vivado", "C", "Python", "Zybo Z7-20"],
    year: 2026,
    isPrivate: true,
    metrics: [{ value: "667 MHz", label: "dual-core ARM PS" }],
  },
  {
    slug: "single-cycle-risc-v",
    repo: "Single-Cycle-RISC-V-Processor-Implemented-on-FPGA",
    title: "Single-Cycle RISC-V Processor",
    tagline: "A complete RV32I datapath and control unit on a Nexys A7.",
    summary:
      "Instruction memory, data memory, ALU, immediate generator, branch comparator and control logic in SystemVerilog, supporting all R, I, S, B, U and J instruction types. The foundation the pipelined core was built on.",
    category: "fpga",
    tags: ["Computer architecture", "RISC-V", "Processor design"],
    tech: ["SystemVerilog", "Vivado", "Nexys A7", "Assembly"],
    year: 2025,
    metrics: [{ value: "RV32I", label: "full ISA" }],
  },
  {
    slug: "car-security-system",
    repo: "FPGA-Based-Smart-Car-Security-System",
    title: "FPGA Smart Car Security System",
    tagline: "A concealed, reprogrammable anti-theft FSM with siren and fuel-pump interlock.",
    summary:
      "Designed on the DE1-SoC in Verilog and SystemVerilog: a reprogrammable finite state machine detects unauthorized entry, debounces sensor inputs, generates a siren and cuts the fuel pump. Timers and debouncers were verified glitch-free in simulation.",
    category: "fpga",
    tags: ["FSM", "Verilog", "Security"],
    tech: ["Verilog", "SystemVerilog", "Quartus", "ModelSim", "DE1-SoC"],
    year: 2025,
  },
  {
    slug: "cache-simulator",
    repo: "Cache-Architecture-Simulator-Design",
    title: "Cache Architecture Simulator",
    tagline: "A from-scratch cache simulator driven by valgrind traces, comparing LRU and random eviction.",
    summary:
      "Two projects in C and C++: a full cache simulator that replays memory traces to measure hits, misses and evictions, and an analysis of least-recently-used against random replacement policies.",
    category: "hpc",
    tags: ["Computer architecture", "Memory hierarchy", "C++"],
    tech: ["C", "C++", "Make", "valgrind"],
    year: 2025,
    motif: "grid",
  },

  // ───────────────────────── Embedded & IoT ─────────────────────────
  {
    slug: "aqi-monitoring",
    repo: "Crowd-Sourced-AQI-Monitoring-System",
    title: "Crowd-Sourced AQI Monitor",
    tagline: "Six sensors, Bluetooth to a phone app, and AQI within 1% of the US Embassy station.",
    summary:
      "A low-cost air-quality node built around PMS5003, MQ7, MQ2, MQ135, DHT22 and BME280 sensors that measures PM2.5, PM10, CO, temperature, humidity and pressure. Many nodes deployed by many people form a distributed pollution map. Its AQI matched the official US Embassy Islamabad readings at 99% accuracy, and it seeded the BreatheSafe initiative.",
    category: "embedded",
    tags: ["IoT", "Sensors", "Environment", "BreatheSafe"],
    tech: ["Arduino UNO", "C/C++", "PMS5003", "MQ-series", "BME280", "Bluetooth"],
    year: 2024,
    metrics: [
      { value: "99%", label: "AQI agreement" },
      { value: "6", label: "sensors" },
    ],
  },
  {
    slug: "egg-incubator",
    repo: "Fully-Automated-Egg-Incubator",
    title: "Fully Automated Egg Incubator",
    tagline: "ATmega328P climate control and egg turning that hatched every pigeon egg in 18 days.",
    summary:
      "Temperature and humidity are held in tight bands by a heater, fan and water unit, a stepper motor turns the eggs on schedule, and an LCD and buzzer report status and alarms. The incubator held 50–64% humidity during incubation and 65–76% during hatching.",
    category: "embedded",
    tags: ["Control", "Automation", "AVR"],
    tech: ["ATmega328P", "Arduino IDE", "Atmel Studio", "Proteus", "DHT11", "DS18B20", "Stepper motor"],
    year: 2024,
    metrics: [
      { value: "100%", label: "hatch rate" },
      { value: "18 days", label: "to hatch" },
    ],
  },
  {
    slug: "health-tracker",
    repo: "Smart-Health-Tracking-System",
    title: "Smart Health Tracking System",
    tagline: "ECG, SpO₂, heart rate, temperature and fall detection on one wearable node.",
    summary:
      "An integrated patient monitor built on Arduino with an AD8232 ECG front end, MAX30100 pulse oximeter, DS18B20 temperature sensor and an MPU6050 for fall detection, feeding a live dashboard for remote care of elderly patients.",
    category: "embedded",
    tags: ["Healthcare", "Wearable", "Sensors"],
    tech: ["Arduino UNO", "C/C++", "AD8232", "MAX30100", "MPU6050", "DS18B20"],
    year: 2024,
    metrics: [{ value: "95–98%", label: "sensor accuracy" }],
  },
  {
    slug: "electricity-theft-detection",
    repo: "IoT-Based-Electricity-Theft-Detection",
    title: "IoT Electricity Theft Detection",
    tagline: "A smart meter that spots tampering and bypass with anomaly alerts.",
    summary:
      "Addresses a real problem for Pakistani utilities: an IoT meter compares expected and measured consumption, detects anomalies that indicate theft, and raises remote alerts for the distribution operator.",
    category: "embedded",
    tags: ["IoT", "Energy", "Anomaly detection"],
    tech: ["Arduino UNO", "C/C++", "Current sensors", "IoT"],
    year: 2024,
  },
  {
    slug: "ball-balancing-pid",
    repo: "PID-Controlled-One-Axis-Ball-Balancing-System",
    title: "PID Ball Balancing System",
    tagline: "A one-axis beam that settles a ball at a target distance in under 30 seconds.",
    summary:
      "An ultrasonic sensor measures ball position, a PID loop drives a servo to tilt the beam, and Kp, Ki and Kd can be tuned live over serial. Includes stability detection and an automatic reset to neutral.",
    category: "embedded",
    tags: ["Control systems", "PID", "Arduino"],
    tech: ["Arduino UNO", "C/C++", "Ultrasonic sensor", "Servo"],
    year: 2025,
    metrics: [{ value: "<30 s", label: "settling time" }],
  },
  {
    slug: "am-superheterodyne",
    repo: "AM-Modulator-and-Superheterodyne-AM-Receiver",
    title: "AM Transmitter & Superheterodyne Receiver",
    tagline: "A MOSFET AM modulator and a 455 kHz IF receiver, designed and simulated in Proteus.",
    summary:
      "A medium-wave communication chain: a 1.2 MHz carrier modulated by a MOSFET stage, then a superheterodyne receiver that mixes down to a 455 kHz intermediate frequency and recovers the audio with an envelope detector. Every stage is verified on the Proteus oscilloscope.",
    category: "embedded",
    tags: ["Analog", "RF", "Communication systems"],
    tech: ["Proteus", "MOSFET", "LC tank", "Envelope detector"],
    year: 2025,
    motif: "pcb",
    metrics: [
      { value: "1.2 MHz", label: "carrier" },
      { value: "455 kHz", label: "IF" },
    ],
  },

  // ───────────────────────── Robotics ─────────────────────────
  {
    slug: "obstacle-avoiding-robot",
    repo: "Obstacle-Avoiding-Robot",
    title: "Obstacle-Avoiding Robot",
    tagline: "An ultrasonic rover that stops, reverses and turns around anything in its way.",
    summary:
      "An Arduino robot with an ultrasonic range finder and motor driver that navigates autonomously by detecting obstacles within a set distance and re-planning its heading.",
    category: "robotics",
    tags: ["Autonomous", "Sensors", "Arduino"],
    tech: ["Arduino UNO", "C/C++", "HC-SR04", "L298N"],
    year: 2024,
  },
  {
    slug: "line-following-robot",
    repo: "Line-Following-Robot",
    title: "Line-Following Robot",
    tagline: "Two IR sensors and a decision loop keep the car on a black line.",
    summary:
      "A classic line follower on Arduino UNO with dual infrared sensors and real-time direction control, demonstrating sensor integration and closed-loop decision making.",
    category: "robotics",
    tags: ["Autonomous", "IR sensors", "Arduino"],
    tech: ["Arduino UNO", "C/C++", "IR sensors"],
    year: 2024,
  },
  {
    slug: "human-following-robot",
    repo: "Human-Following-Robot",
    title: "Human-Following Robot",
    tagline: "A compact robot that tracks and follows a person with three IR sensors.",
    summary:
      "Three infrared sensors detect direction and movement so the robot turns left, right or drives straight to stay with its target. Aimed at assistance, retail and warehouse use cases.",
    category: "robotics",
    tags: ["Autonomous", "IR sensors", "Arduino"],
    tech: ["Arduino UNO", "C/C++", "IR sensors"],
    year: 2024,
  },

  // ───────────────────────── Web & Product ─────────────────────────
  {
    slug: "verre-optics",
    repo: "Verre-Optics",
    title: "Verre Optics",
    tagline: "Private, in-browser eyewear styling from a single photo. No uploads, no account.",
    summary:
      "An editorial web app that reads face shape, features and skin tone entirely client-side with 68-landmark face detection, then recommends frame shapes, colors and sizes with a printable report. Full light and dark themes, scroll-driven GSAP motion and reduced-motion support.",
    category: "web",
    tags: ["Product", "Face analysis", "Front-end"],
    tech: ["React", "Vite", "Tailwind", "GSAP", "face-api"],
    year: 2026,
    live: "https://verre-optics.vercel.app",
    metrics: [
      { value: "68", label: "facial landmarks" },
      { value: "0", label: "photos leave the browser" },
    ],
  },

  // ───────────────────────── HPC & Systems ─────────────────────────
  {
    slug: "laplace-solver",
    repo: "Laplace-Solver-Supercomputer",
    title: "Parallel Laplace Solver on HPC",
    tagline: "MPI versus OpenMP for a 2D Jacobi solver on a 128-core AMD EPYC cluster.",
    summary:
      "Benchmarks distributed-memory (MPI) against shared-memory (OpenMP) parallelism for a 2D Laplace equation solver on the NUST RCMS supercomputer, with correctness checks, cluster mapping scripts and speedup and efficiency plots. MPI scaled to 3.06× at eight processes where OpenMP flattened out.",
    category: "hpc",
    tags: ["Parallel computing", "MPI", "OpenMP", "Benchmarking"],
    tech: ["C++", "MPI", "OpenMP", "CMake", "Python", "AMD EPYC 7452"],
    year: 2026,
    metrics: [
      { value: "3.06×", label: "MPI speedup, 8 ranks" },
      { value: "128", label: "CPUs mapped" },
    ],
  },
  {
    slug: "maketensor",
    repo: "maketensor",
    title: "maketensor",
    tagline: "The data pipeline that turns telescope FITS frames into training-ready HDF5 tensors.",
    summary:
      "Contributed to during the NRC Herzberg internship: converts CLASSY survey difference images into cutout shards, stages them to scratch storage, injects synthetic moving objects, and loads sequences for the TNO detection network.",
    category: "hpc",
    tags: ["Data pipeline", "Astronomy", "HDF5"],
    tech: ["Python", "HDF5", "Astropy", "NumPy"],
    year: 2026,
    fork: { owner: "sfabbro", note: "Forked from Dr. Sébastien Fabbro's repository." },
    motif: "grid",
  },
];

export const featuredProjects = projects
  .filter((p) => p.featured !== undefined)
  .sort((a, b) => (a.featured ?? 99) - (b.featured ?? 99));

export const projectBySlug = (slug: string) => projects.find((p) => p.slug === slug);

export const githubUrl = (p: Project) => `${GH}${p.repo}`;

export const projectsByCategory = (id: CategoryId) => projects.filter((p) => p.category === id);
