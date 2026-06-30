import { usePathname, useRouter } from 'next/navigation'
import style from './style.module.scss'
import FaqAccordion, { type FaqItem } from './FaqAccordion'

interface MenuItem {
    nome: string;
    href: string;
}

interface PaginaInstitucionalProps {
    menu: MenuItem[];
    titulo: string;
    imagem?: string;
    conteudo: string;
    faq?: FaqItem[];
}

export default function Institucional({
    menu = [],
    titulo = "",
    imagem = "",
    conteudo = "",
    faq = []
}: PaginaInstitucionalProps): JSX.Element {
    const pathname = usePathname()
    const router = useRouter()


    return (
        <div className={style.bloco_institucional}>
            <div data-fs-content>
                <div className={style.bloco_institucional_flex}>
                    {/* Menu de Navegação */}
                    {menu.length > 0 && (
                        <>
                            {/* Select para mobile */}
                            <div className={style.bloco_institucional_select}>
                                <select
                                    value={pathname}
                                    onChange={(e) => router.push(e.target.value)}
                                >
                                    {menu.map((item, index) => (
                                        <option key={index} value={item.href}>
                                            {item.nome}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Links para desktop */}
                            <div className={style.bloco_institucional_menu}>
                                {menu.map((item, index) => {
                                    const isActive = pathname === item.href
                                    return (
                                        <a
                                            key={index}
                                            href={item.href}
                                            className={isActive ? style.active : ''}
                                            aria-current={isActive ? 'page' : undefined}
                                        >
                                            <span>{item.nome}</span>
                                            <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.75 0.75L4.75 4.75L0.75 8.75" stroke="#161616" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                                        </a>
                                    )
                                })}
                            </div>
                        </>
                    )}

                    {/* Conteúdo */}
                    <div className={style.bloco_institucional_conteudo}>
                        {titulo && <h1 className={style.bloco_institucional_title}>{titulo}</h1>}

                        {imagem && (
                            <div>
                                <img src={imagem} alt={titulo} />
                            </div>
                        )}

                        {conteudo && (
                            <div dangerouslySetInnerHTML={{ __html: conteudo }} />
                        )}

                        <FaqAccordion items={faq} />
                    </div>
                </div>
            </div>
        </div>
    );
}