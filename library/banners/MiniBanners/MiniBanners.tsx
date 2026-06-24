import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination } from 'swiper/modules'
import NextImage from 'next/image'
import Link from 'next/link'
import styles from './minibanners.module.scss'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

interface MiniBanner {
    link: string
    image: string
    alt: string
    width: number
    height: number
}

interface MiniBannersProps {
    title: string
    quantity: number
    espacamento: number
    ver_todos: string
    banners: MiniBanner[]
}

export default function MiniBanners({ banners, title, quantity, espacamento, ver_todos }: MiniBannersProps) {

    return (
        <section className={styles.miniBanners}>
            <div data-fs-content>
                {title && (
                <div className={styles.top}>
                    <h2 className={styles.title}>{title}</h2>

                    {ver_todos && (
                    <a href={ver_todos}>Ver todos</a>
                    )}
                </div>
                )}
                <ul data-slider="true">
                    <Swiper
                        modules={[Pagination]}
                        pagination={{ clickable: true }}
                        slidesPerView="auto"
                        spaceBetween={6}
                        breakpoints={{
                            1024: {
                                slidesPerView: quantity,
                                spaceBetween: espacamento,
                            },
                        }}
                        className={styles.swiper}
                    >
                        {banners?.map((banner, index) => (
                            <SwiperSlide key={index} style={{ '--slide-width': `${banner.width}px` } as React.CSSProperties}>
                                <li data-slider-item={index}>
                                    <Link href={banner.link}>
                                        <figure>
                                            <NextImage
                                                src={banner.image}
                                                alt={banner.alt}
                                                width={banner.width}
                                                height={banner.height}
                                                loading="lazy"
                                            />
                                        </figure>
                                    </Link>
                                </li>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </ul>
            </div> 
        </section>
    )
} 