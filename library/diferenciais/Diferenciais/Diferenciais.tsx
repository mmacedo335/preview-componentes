import styles from './diferenciais.module.scss'

interface DiferenciaisItem {
    svg: string
    title: string
    description: string
}

interface DiferenciaisProps {
    items: DiferenciaisItem[]
}

export default function Diferenciais({ items }: DiferenciaisProps) {

    return (
        <section className={styles.diferenciais}>
            <div data-fs-content>
                <div data-fs-content-flex>
                {items?.map((item, index) => (
                    <div key={index} className={styles.item}>
                        <div dangerouslySetInnerHTML={{ __html: item.svg }} />
                        <div className={styles.text}>
                            <div>{item.title}</div> 
                            <p>{item.description}</p>
                        </div>   
                    </div>
                ))}
                </div>
            </div>
        </section>
    )
}