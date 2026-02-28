# AgriShare 🚜🌾

AgriShare is a premium, high-performance multivendor marketplace designed to empower farmers and agricultural enthusiasts. Built with **Next.js 15**, **Supabase**, and **Tailwind CSS**, it facilitates direct trade, real-time communication, and transparent agricultural commerce.

## ✨ Core Features

*   **🛒 Comprehensive Marketplace:** A robust platform for buying and selling fresh farm produce with categorized listings and organic certifications.
*   **💬 Real-Time Messaging:** Direct communication channel between buyers and sellers to discuss quality, price, and delivery.
*   **📦 Order Lifecycle Tracking:** End-to-end tracking from order placement through confirmation, shipping, and delivery with a visual timeline.
*   **📍 Precision Checkout:** Integrated location selection using pin-drop maps for precise delivery addresses.
*   **🚜 Specialized Seller Profiles:** Detailed farm profiles including acreage, soil types, and specialized crops.
*   **⭐ Ratings & Reviews:** A translucent trust system where buyers can rate and review products post-delivery.
*   **❤️ Advanced Saved Hub:** Personalized wishlist for products, favorite sellers, and saved search filters for quick re-discovery.
*   **🔐 Enterprise-Grade Security:** Row-Level Security (RLS) policies in Supabase ensure data privacy and secure transactions.

## 🛠️ Technology Stack

*   **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
*   **Database & Auth:** [Supabase](https://supabase.com/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **State Management:** [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)
*   **Animations:** [Framer Motion](https://www.framer.com/motion/)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Components:** Custom UI with Glassmorphism and Premium Micro-interactions

## 🚀 Getting Started

### Prerequisites

*   Node.js 18+ 
*   Supabase Account & Project

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/vedantdarange/AgriShare.git
    cd AgriShare
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env.local` file in the root directory and add your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

## 📜 Development Notes

*   **Database Schema:** The complete database schema is located in `full_schema.sql`.
*   **Stability:** The app includes multi-layered safety timeouts (4s global auth, 10s page data) to ensure a flawless loading experience even on slow connections.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---
Built with ❤️ for the Agricultural Community.
