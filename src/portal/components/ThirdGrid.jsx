import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import SectionHeader from "./SectionHeader";
import "../styles/ThirdGrid.css";
import Propaganda from "./Propaganda"; // ✅ AQUI




import  { API_BASE_URL } from '../../services/api'; // Importando o arquivo de configuração do Axios

const truncateText = (text, maxLength) => {
    if (!text || typeof text !== 'string') return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };
  

const ThirdGrid = ({ link }) => {
    const [ultimasNoticias, setUltimasNoticias] = useState([]);
    const [noticiasRegiao, setNoticiasRegiao] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 880);
    // 📱 Mobile
    const [visibleUltimas, setVisibleUltimas] = useState(10);
    const [visibleRegiao, setVisibleRegiao] = useState(10);

    // 💻 Desktop
    const [scrollUltimasLimit, setScrollUltimasLimit] = useState(10);
    const [scrollRegiaoLimit, setScrollRegiaoLimit] = useState(10);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [meioListaAds, setMeioListaAds] = useState(false);




    useEffect(() => {
        const fetchNoticias = async () => {
          try {
            const ultimasRes = await axios.get(`${API_BASE_URL}/noticias/resumo`);
            const regiaoRes = await axios.get(`${API_BASE_URL}/noticias/regiao/resumo`);
            const anuncioMeioLista = await axios.get(`${API_BASE_URL}/anuncios/espaco/horizontal-2/todos`);
      
            // 🔽 Ordena por valor (quem paga mais em primeiro)
            const ordenados = anuncioMeioLista.data.sort((a, b) => b.valor - a.valor);
      
            setUltimasNoticias(ultimasRes.data);
            setNoticiasRegiao(regiaoRes.data);
            setMeioListaAds(ordenados);
          } catch (error) {
            console.error("Erro ao buscar notícias ou anúncios:", error);
          } finally {
            setLoading(false);
          }
        };
      
        fetchNoticias();
        
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    useEffect(() => {
        if (!isMobile) {
            const handleScroll = () => {
                const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 300;
    
                if (nearBottom && !isFetchingMore) {
                    setIsFetchingMore(true); // evita múltiplos disparos
    
                    setTimeout(() => {
                        setScrollUltimasLimit(prev => {
                            const next = prev + 5;
                            return next <= ultimasNoticias.length ? next : ultimasNoticias.length;
                        });
    
                        setScrollRegiaoLimit(prev => {
                            const next = prev + 5;
                            return next <= noticiasRegiao.length ? next : noticiasRegiao.length;
                        });
    
                        setIsFetchingMore(false); // libera pra próxima rolagem
                    }, 400); // pequeno delay para evitar avalanche
                }
            };
    
            window.addEventListener('scroll', handleScroll);
            return () => window.removeEventListener('scroll', handleScroll);
        }
    }, [isMobile, isFetchingMore, ultimasNoticias.length, noticiasRegiao.length]);
    
    
    
    

    const handleView = async (slug) => {
        try {
            await axios.post(`${API_BASE_URL}/noticias/view/${slug}`);
        } catch (error) {
            console.error("Erro ao contabilizar visualização:", error);
        }
    };

    const stripHtml = (html) => html.replace(/<[^>]+>/g, '');
    const decodeHtml = (html) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
    };

  

    const renderNoticias = (noticias, limit) => {
            return noticias.slice(0, limit).map((article, index) => (
            <React.Fragment key={index}>
                <Link 
                    to={`/noticia/${article.slug}`} 
                    className="grid-item2"
                    onClick={() => handleView(article.slug)}
                >
                    <div className="content_news_third_item">
                        <div className="tagdiv">
                            <span className="tag_category_third_primary">{article.categoria}</span>
                        </div>
                            <h3 className="title_news_third">{truncateText(article.titulo, isMobile ? 40 : 70)}</h3>
                            <p className="subtitle_news_third">
                                {truncateText(decodeHtml(stripHtml(article.subtitulo)), isMobile ? 60 : 190)
}
                            </p>


                    </div>
                    <div className="image-wrapper left-image">
                        <img src={article.imagem} alt={article.titulo} />
                    </div>
                </Link>

                {/* 🔹 INSERE UMA PROPAGANDA A CADA 5 NOTÍCIAS */}
                {(index + 1) % 5 === 0 && meioListaAds.length > 0 && (() => {
                const posicao = Math.floor(index / 5) % meioListaAds.length;
                const ad = meioListaAds[posicao];

                return (
                    <div className="ad-container">
                    <Propaganda
                        tipo={ad.tipo}
                        imagem={ad.imagem}
                        link={ad.link}
                        id={ad.google_client_id}
                        slot={ad.google_slot}
                    />
                    </div>
                );
                })()}





            </React.Fragment>
        ));
    };

    const renderNoticiasRegiao = (noticias, limit) => {
                // Filtra apenas notícias cuja categoria contém "Região"
                return noticias
                    .filter(article => article && article.categoria && article.categoria.toLowerCase().includes('região'))
                    .slice(0, limit)
                    .map((article, index) => {
                        if (
                            !article || 
                            !article.slug || 
                            !article.titulo || 
                            !article.categoria || 
                            !article.imagem
                        ) return null;
        
                        return (
                            <Link 
                                to={`/noticia/${article.slug}`} 
                                className="grid-item2"
                                onClick={() => handleView(article.slug)}
                                key={index}
                            >
                                <div className="content_news_third_region">
                                    <div className="tagdiv">
                                        <span className="tag_category_third_secondary">{article.categoria}</span>
                                    </div>
                                    <h3 className="title_secondary_third">{truncateText(article.titulo, isMobile ? 60 : 90)}</h3>

                                </div>
                                <div className="image-wrapper left-image">
                                    <img src={article.imagem} alt={article.titulo} />
                                </div>
                            </Link>
                        );
                    });
            };
      
    

    return (
        <section className="third-grid">
            <div className="left-column">
            <SectionHeader 
                title="Últimas Notícias do Brasil e do Mundo" 
                linkText="Ver todas"
                linkTo="/ver-todos/ultimas"
                className="section_header_news_third_primary"
            />

                {loading ? <p>Carregando notícias...</p> : renderNoticias(ultimasNoticias, isMobile ? visibleUltimas : scrollUltimasLimit)}

                {isMobile && visibleUltimas < ultimasNoticias.length && (
                    <button onClick={() => setVisibleUltimas(prev => prev + 6)} className="ver-mais-btn">
                        Veja Mais
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" height="15px" width="15px" class="icon">
                    <path stroke-linejoin="round" stroke-linecap="round" stroke-miterlimit="10" stroke-width="1.5" stroke="#292D32" d="M8.91016 19.9201L15.4302 13.4001C16.2002 12.6301 16.2002 11.3701 15.4302 10.6001L8.91016 4.08008"></path>
                    </svg>
                    </button>
                )}

            </div>

            <div className="right-column">
                <div className="ad">
                    <Link to="/anuncio" className="ad-link">
                        <img src="/img/propaganda-2.jpg" alt="Ad" />
                    </Link>
                </div>
                <SectionHeader 
                    title="Notícias da Região" 
                    linkText="Ver todas" 
                    linkTo="/ver-todos/regiao"
                    className="section_header_news_third_secondary"
                />
                {loading ? <p>Carregando notícias...</p> : renderNoticiasRegiao(noticiasRegiao, isMobile ? visibleRegiao : scrollRegiaoLimit)
                }



                {isMobile && visibleRegiao < noticiasRegiao.length && (
                    <button onClick={() => setVisibleRegiao(prev => prev + 10)} className="ver-mais-btn">
                        Ver mais
                    </button>
                )}

            </div>
        </section>
    );
};

export default ThirdGrid;
