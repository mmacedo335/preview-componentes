import NextImage from 'next/image'
import Link from 'next/link'
import useScreenResize from 'src/sdk/ui/useScreenResize'
import styles from './style.module.scss'

interface BannerFixo {
    link: string
    image: string
    alt: string
    width?: number
    height?: number
}

interface BannerFixoProps {
    bannerDesktop: BannerFixo
    bannerMobile: BannerFixo
}

export default function BannerFixo({ bannerDesktop, bannerMobile }: BannerFixoProps) {
    const { isDesktop } = useScreenResize()

    const desktopWidth = bannerDesktop?.width || 1920
    const desktopHeight = bannerDesktop?.height || 400
    const mobileWidth = bannerMobile?.width || 768
    const mobileHeight = bannerMobile?.height || 400

    if (isDesktop) {
        return (
            <section className={styles.bannerFixo}>
                <div data-fs-content>
                    <Link href={bannerDesktop.link}>
                        <figure>
                            <NextImage
                                src={bannerDesktop.image}
                                alt={bannerDesktop.alt}
                                width={desktopWidth}
                                height={desktopHeight}
                                loading="lazy"
                                priority={false}
                            />
                        </figure>
                    </Link>
                </div>
            </section>
        )
    } else {
        return (
            <section className={styles.bannerFixo}>
                <div data-fs-content>
                    <Link href={bannerMobile.link}>
                        <figure>
                            <NextImage
                                src={bannerMobile.image}
                                alt={bannerMobile.alt}
                                width={mobileWidth}
                                height={mobileHeight}
                                loading="lazy"
                                priority={false}
                            />
                        </figure>
                    </Link>
                </div>
            </section>
        )
    }
}
