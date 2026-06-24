import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import NextImage from 'next/image'
import Link from 'next/link'
import styles from './fullbanner.module.scss'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

interface Banner {
    link: string
    bannerDesktop: string
    bannerMobile: string
    alt: string
}

interface FullBannerProps {
    banners: Banner[]
}

export default function FullBanner({ banners }: FullBannerProps) {

    return (
        <section className={styles.fullBanner}>
            <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                navigation
                pagination={{ clickable: true }}
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                loop={true}
                className={styles.swiper}
            >
                {banners?.map((banner, index) => (
                    <SwiperSlide key={index}>
                        <Link href={banner.link}>
                            <picture>
                                <source media="(min-width: 768px)" srcSet={banner.bannerDesktop} />
                                <NextImage
                                    src={banner.bannerMobile}
                                    alt={banner.alt}
                                    width={1920}
                                    height={600}
                                    priority={index === 0}
                                    className={styles.bannerImage}
                                />
                            </picture>
                        </Link>
                    </SwiperSlide>
                ))} 
            </Swiper>
        </section>
    )
}