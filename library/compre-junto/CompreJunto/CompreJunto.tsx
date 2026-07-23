import React, { useEffect, useState } from "react";
import { useProduct } from "vtex.product-context";
import { GetById } from "./GetById.jsx";
import { CardProduct } from "./CardProduct.tsx";
import { InfosAndAddToCart } from "./InfosAndAddToCart.jsx";
import styles from "./styles.css";

const BuyTogether = () => {
  const product = useProduct()?.product;
  const [currentProduct, setCurrentProduct] = useState(product);
  const productContextValue = useProduct();
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [length, setLength] = useState(0);
  const [totalPrice, setTotalPrice] = useState({
    totalCurrentPrice: 0,
  });


  const [precoPiso, setPrecoPiso] = useState(0);
  const [unidadeMedida, SetUnindadeMedida] = useState(0);
  const [lowPriceValue, SetLowPriceValue] = useState(productContextValue?.selectedItem?.sellers?.[0]?.commertialOffer?.spotPrice ?? 0);

  useEffect(() => {
    const found = productContextValue?.product?.specificationGroups?.find(
      (item) => item.name === "Calculadora de Pisos",
    );

    if (found) {
      const discountProduct = productContextValue?.selectedItem?.sellers?.[0]?.commertialOffer?.teasers?.find(item => item.name === "Promoção Pix 5% ")?.effects?.parameters?.find(item => item.name === "PercentualDiscount")?.value;
      let spotPrice = productContextValue?.selectedItem?.sellers?.[0]?.commertialOffer?.spotPrice ?? 0;
      if (discountProduct) {
        const percentualDesconto = parseFloat(discountProduct);
        const fatorDesconto = 1 - percentualDesconto / 100;
        spotPrice = spotPrice * fatorDesconto;
      }
      SetLowPriceValue(spotPrice);
      let unidade = productContextValue?.selectedItem?.unitMultiplier ?? 1;
      const valueCheio = spotPrice * unidade;
      setPrecoPiso(valueCheio);
      SetUnindadeMedida(unidade);
    }
  }, [productContextValue]);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const SIMILARS =
          `/api/catalog_system/pub/products/crossselling/suggestions/`;
        const PRODUCT_ID = currentProduct?.productId;

        const similarsResponse = await fetch(SIMILARS + PRODUCT_ID);
        const json = await similarsResponse.json();

        // Filtrando os productIds únicos
        const uniqueProductIds = [
          ...new Set(json.map((item) => item.productId)),
        ];
        setRelatedProducts(uniqueProductIds);
        setLength(uniqueProductIds.length);

        // Calcular o preço total do produto atual com apenas o sellingPrice
        const lowPrice = parseFloat(
          productContextValue?.selectedItem?.sellers?.[0]?.commertialOffer?.spotPrice || "0",
        );

        const totalProductPrice = lowPrice; // Somente o preço de venda do produto atual

        // Filtrando os produtos duplicados (com o mesmo productId)
        const uniqueProducts = json.filter((item, index, self) =>
          index === self.findIndex((t) => (
            t.productId === item.productId
          ))
        );

        // Calcular o preço total dos produtos relacionados, considerando apenas o sellingPrice
        let totalCurrentPrice = 0; // Iniciar com o preço do produto atual

        if (precoPiso > 0) {
          totalCurrentPrice = precoPiso;
        } else {
          totalCurrentPrice = totalProductPrice;
        }

        // Somar o preço de venda dos produtos únicos
        for (let item of uniqueProducts) {
          const currentPrice = parseFloat(
            item?.items[0]?.sellers[0]?.commertialOffer?.Price || "0",
          );
          totalCurrentPrice += currentPrice;
        }

        // Atualizar o estado com os preços calculados
        setTotalPrice({
          totalCurrentPrice: totalCurrentPrice,
        });

        setLoading(false);
      } catch (error) {
        console.error("Erro ao buscar produtos relacionados", error);
        setLoading(false);
      }
    };

    if (currentProduct) {
      fetchCatalog();
    }
  }, [currentProduct, precoPiso]);

  if (loading) return null;
  if (!length) return <></>;


  return (
    <div className={styles.boxBuyTogether}>
      <div className="flex mt4 mb7 pt0 pb0 justify-start vtex-flex-layout-0-x-flexRowContent vtex-flex-layout-0-x-flexRowContent--shelfTitle items-stretch w-100">
        <div className="pr0 items-stretch vtex-flex-layout-0-x-stretchChildrenWidth flex">
          <div className="vtex-rich-text-0-x-container flex tl items-start justify-start t-body c-on-base">
            <div className="vtex-rich-text-0-x-wrapper">
              <h2 className={styles.buyTogether__container_title}>
                COMPRE JUNTO
              </h2>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.buyTogether__container_wrapper}>
        {/* Produto atual */}
        <CardProduct
          classes="currentProduct"
          linkText={product.linkText}
          imageUrl={product?.items?.[0]?.images?.[0]?.imageUrl}
          productName={product?.productName}
          highPrice={product?.priceRange?.listPrice?.highPrice}
          lowPrice={lowPriceValue}
          brand={product?.brand}
          productId={product?.productReference}
          skus={product.items}
          precoPiso={precoPiso}
          unidadeMedida={unidadeMedida}
        />

        {/* Produtos similares */}
        {relatedProducts.map((idProduct) => (
          <GetById key={idProduct} idProduct={idProduct} />
        ))}

        {/* Passando as informações de preço e totalProducts para o componente InfosAndAddToCart */}
        <InfosAndAddToCart
          totalCurrentPrice={totalPrice.totalCurrentPrice}
          totalProducts={relatedProducts.length + 1}
        />
      </div>
    </div>
  );
};

export default BuyTogether;