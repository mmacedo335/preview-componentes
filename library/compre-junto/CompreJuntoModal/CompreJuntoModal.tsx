import React, { useEffect, useState } from "react";
import { useOrderItems } from "vtex.order-items/OrderItems";
import styles from "./styles.css";
//@ts-ignore
import { usePixel } from "vtex.pixel-manager";

export const InfosAndAddToCart = (
  {
    totalCurrentPrice: externalTotalCurrentPrice,
    totalProducts: externalTotalProducts,
  },
) => {
  const { push } = usePixel();
  const { addItems } = useOrderItems();
  const [totalCurrentPrice, setTotalCurrentPrice] = useState(
    externalTotalCurrentPrice || 0,
  );
  const [errorMessage, setErrorMessage] = useState(""); // Estado para controlar a mensagem de erro
  const [totalDesconto, setTotalDesconto] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setTotalCurrentPrice(externalTotalCurrentPrice);

    setTimeout(() => {
      const elements = document.querySelectorAll("[data-price-cheio]");
      let total = 0;

      elements.forEach((element) => {
        const price = element.getAttribute("data-price-cheio");
        if (price && price > 0) {
          total += parseFloat(price.replace(",", "."));
          setTotalDesconto(total);
        }
      });
    }, 1500);
  }, [externalTotalCurrentPrice]);

  async function addProdsToCart() {
    setIsLoading(true);
    const elements = document.querySelectorAll(
      'div[class*="product__buyTogether_skus"]',
    );

    let allSelected = true;
    const itemsToAdd = [];

    elements.forEach((element) => {
      const productSku = element.getAttribute("data-selected");

      if (!productSku) {
        allSelected = false;
      } else {
        itemsToAdd.push({
          id: productSku,
          quantity: 1,
          seller: "1",
        });
      }
    });

    if (!allSelected) {
      setErrorMessage("Selecione as variações para adicionar ao carrinho");

      setTimeout(() => {
        setErrorMessage("");
      }, 4000);

      return;
    }

    // Aguarda a adição de todos os itens antes de redirecionar
    await addItems(itemsToAdd);


    setIsLoading(false);


    push({
      id: 'add-to-cart-button-pdp',
    });

  }

  return (
    <div className={styles.products__buyTogether_resume_container}>
      {externalTotalProducts > 0 && (
        <p className={styles.totalProducts}>
          Leve {externalTotalProducts} produtos por
        </p>
      )}

      <p className={styles.products__total}>
        {totalCurrentPrice > 0 && (
          <>
            <span>R$</span>
            <strong className={styles.currentPrice}>
              {totalCurrentPrice.toLocaleString("pt-br", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </strong>
          </>
        )}
      </p>

      {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}

      <a
        className={`${styles.product__buyTogether__buyCta} ${isLoading ? styles.loading : ""
          }`}
        onClick={addProdsToCart}
      >
        COMPRE JUNTO
      </a>

      {totalDesconto != 0 && (
        <div className={styles.product__economize}>
          <p>Você economiza:</p>
          <strong>
            R$ {totalDesconto.toLocaleString("pt-br", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </strong>
        </div>
      )}
    </div>
  );
};