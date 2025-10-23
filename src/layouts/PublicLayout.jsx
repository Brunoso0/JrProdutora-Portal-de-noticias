// layouts/PublicLayout.js
import React from "react";
import Header from "../portal/components/Header";
import Navbar from "../portal/components/Navbar";
import NewsGrid from "../portal/components/NewsGrid";
import SectionHeader from "../portal/components/SectionHeader";
import SecondGrid from "../portal/components/SecondGrid";
import ThirdGrid from "../portal/components/ThirdGrid";

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
