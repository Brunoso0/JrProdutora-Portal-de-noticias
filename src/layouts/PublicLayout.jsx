// layouts/PublicLayout.js
import React from "react";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import NewsGrid from "../components/NewsGrid";
import SectionHeader from "../components/SectionHeader";
import SecondGrid from "../components/SecondGrid";
import ThirdGrid from "../components/ThirdGrid";

const PublicLayout = () => {
  return (
    <>
      <main>
      <Header />
      <Navbar />
        <NewsGrid />
        <SectionHeader 
          title="Notícias da Semana" 
          linkText="Ver todos" 
          linkTo="/ver-todos/semana" 
        />
        <SecondGrid />
        <ThirdGrid link="Ver tudo ->" />
      </main>
    </>
  );
};

export default PublicLayout;
