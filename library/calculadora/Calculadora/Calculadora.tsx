import React, { useState } from "react";
//@ts-ignore
import { useProduct } from "vtex.product-context";
//@ts-ignore
import { useProductDispatch } from "vtex.product-context/ProductDispatchContext";
//@ts-ignore
import { useRuntime } from 'vtex.render-runtime';
//@ts-ignore
import "./style.css";

const CalculoMetros = () => {
  const { deviceInfo } = useRuntime();
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [infos, setInfos] = useState(false);
  const [totalArea, setTotalArea] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addLoss, setAddLoss] = useState(false);
  const [adjustedArea, setAdjustedArea] = useState<number | null>(null);
  const [adjustedCaixas, setAdjustedCaixas] = useState<number | null>(null);
  const productContextValue = useProduct();
  const productQuantity = useProductDispatch();
  const unidadeProduto = productContextValue?.selectedItem?.unitMultiplier || 1;
  const quantitySelected = productContextValue?.selectedQuantity || 1;
  const [totalCaixas, setTotalCaixas] = useState<number | null>(quantitySelected);
  const [addBreakage, setAddBreakage] = useState(false);
  const [preBreakageQuantity, setPreBreakageQuantity] = useState<number | null>(null);
  const [metersInputValue, setMetersInputValue] = useState(() =>
    `${(unidadeProduto * quantitySelected).toFixed(2)} m²`
  );


  const handleMetersFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const numeric = parseFloat(e.target.value);
    setMetersInputValue(isNaN(numeric) ? "" : numeric.toFixed(2));
  };

  const handleMetersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMetersInputValue(e.target.value);
  };

  const handleMetersBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const meters = parseFloat(e.target.value);
    if (!isNaN(meters) && meters > 0) {
      const caixas = Math.ceil(meters / unidadeProduto);
      setTotalCaixas(caixas);
      productQuantity({ type: "SET_QUANTITY", args: { quantity: caixas } });
      setMetersInputValue(`${meters.toFixed(2)} m²`);
    } else {
      const fallback = (totalCaixas ?? 1) * unidadeProduto;
      setMetersInputValue(`${fallback.toFixed(2)} m²`);
    }
  };

  const calcular = () => {
    setInfos(true);
    let area = (parseFloat(width) || 0) * (parseFloat(height) || 0);
    setTotalArea(area);
    setTotalCaixas(Math.ceil(area / unidadeProduto));

    // Se o checkbox estiver ativo, já ajusta a área
    if (addLoss) {
      const adjusted = area * 1.1;
      setAdjustedArea(adjusted);
      setAdjustedCaixas(Math.ceil(adjusted / unidadeProduto));
    }
  };

  const handleToggleLoss = () => {
    setAddLoss((prev) => {
      const newAddLoss = !prev;
      if (totalArea !== null) {
        const adjusted = totalArea * (newAddLoss ? 1.1 : 1);
        const newAdjustedCaixas = Math.ceil(adjusted / unidadeProduto);

        setAdjustedArea(adjusted);
        setAdjustedCaixas(newAdjustedCaixas);
        setTotalCaixas(newAdjustedCaixas);

      } else {
        setAdjustedArea(null);
        setAdjustedCaixas(null);
      }
      return newAddLoss;
    });
  };


  const increase = () => {
    if (totalCaixas) {
      productQuantity({ type: "SET_QUANTITY", args: { quantity: totalCaixas } });
      setMetersInputValue(`${(totalCaixas * unidadeProduto).toFixed(2)} m²`);
      setIsModalOpen(false);
    }
  };

  const handleToggleBreakage = () => {
    setAddBreakage((prev) => {
      const newAddBreakage = !prev;
      const currentQty = totalCaixas ?? 1;

      if (newAddBreakage) {
        setPreBreakageQuantity(currentQty);
        const newQty = Math.ceil(currentQty * 1.10);
        setTotalCaixas(newQty);
        setMetersInputValue(`${(newQty * unidadeProduto).toFixed(2)} m²`);
        productQuantity({ type: "SET_QUANTITY", args: { quantity: newQty } });
      } else {
        const revertQty = preBreakageQuantity ?? currentQty;
        setTotalCaixas(revertQty);
        setMetersInputValue(`${(revertQty * unidadeProduto).toFixed(2)} m²`);
        productQuantity({ type: "SET_QUANTITY", args: { quantity: revertQty } });
        setPreBreakageQuantity(null);
      }

      return newAddBreakage;
    });
  };

  const increaseQuantity = () => {
    setTotalCaixas((prev) => {
      const newTotalCaixas = (prev ?? 0) + 1;
      const newArea = newTotalCaixas * unidadeProduto;
      setTotalArea(newArea);
      setMetersInputValue(`${newArea.toFixed(2)} m²`);
      productQuantity({ type: "SET_QUANTITY", args: { quantity: newTotalCaixas } });
      return newTotalCaixas;
    });
  };

  const decreaseQuantity = () => {
    setTotalCaixas((prev) => {
      if (prev && prev > 1) {
        const newTotalCaixas = prev - 1;
        const newArea = newTotalCaixas * unidadeProduto;
        setTotalArea(newArea);
        setMetersInputValue(`${newArea.toFixed(2)} m²`);
        productQuantity({ type: "SET_QUANTITY", args: { quantity: newTotalCaixas } });
        return newTotalCaixas;
      }
      return prev;
    });
  };


  return (
    <>
      <div className="descricao-quantidade">

        {deviceInfo.type !== "phone" && (
          <span>
            Unidade mínima de <br /> compra: <strong>{unidadeProduto.toFixed(2)} m² (1 caixa)</strong>
          </span>
        )}
        {deviceInfo.type === "phone" && (
          <span>
            Unidade mínima de compra: <strong>{unidadeProduto.toFixed(2)} m² (1 caixa)</strong>
          </span>
        )}

        <button onClick={() => setIsModalOpen(true)} className="open-modal-button">
          CALCULAR METRAGEM
        </button>
      </div>

      <form className="formQuantity">
        <strong>SELECIONE A QUANTIDADE:</strong>
        <div className="quantity-box">
          <div className="plus" onClick={increaseQuantity} aria-label="Ícone para selecionar aumento na quantidade de produtos"><svg width="15" height="8" viewBox="0 0 15 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 7L7.5 1L1 7" stroke="#212121" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg></div>
          <input
            type="text"
            name="quantity"
            value={metersInputValue}
            onFocus={handleMetersFocus}
            onChange={handleMetersChange}
            onBlur={handleMetersBlur}
          />
          <div className="minus" onClick={decreaseQuantity} aria-label="Ícone para diminuição na quantidade de produtos"><svg width="15" height="8" viewBox="0 0 15 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L7.5 7L14 1" stroke="#212121" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          </div>
        </div>

        {totalCaixas !== null && totalCaixas > 1 && (
          <small className="total-box">(<span>{totalCaixas}</span> caixas)</small>
        )}
        {totalCaixas === null || totalCaixas === 1 && (
          <small className="total-box">(<span>1</span> caixa)</small>
        )}
      </form>

      <div className="quebra-checkbox">
        <input
          type="checkbox"
          id="add-breakage"
          checked={addBreakage}
          onChange={handleToggleBreakage}
        />
        <label htmlFor="add-breakage">Seja prevenido, adicione 10% extra para perdas e cortes.</label>
      </div>

      {isModalOpen && (
        <>
          <div className="background" onClick={() => { setIsModalOpen(false); setInfos(true); }}></div>
          <div className="modal-calculo-medidas pdp">
            <div className="close" onClick={() => { setIsModalOpen(false); setInfos(true); }}>×</div>
            <div className="title">Calculadora de Pisos e Azulejos</div>
            <div className="subtitle">Digite o tamanho do seu ambiente:</div>
            <div className="area-inputs">
              <div>
                <label>Comprimento (m)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>
              <div>
                <label>Largura (m)</label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                />
              </div>
              <button onClick={calcular}>Calcular</button>
            </div>

            {infos === true && totalArea !== null && (
              <>
                <div className="resultado">
                  <span className="resultado-title">Resultado</span>
                  <p>Para <strong>{totalArea.toFixed(2)} m²</strong> a quantidade mínima que você deverá adicionar ao carrinho é:</p>
                  <p className="total"><strong>{totalArea.toFixed(2)} m²</strong> (Totalizando {totalCaixas} caixas)</p>
                </div>
                <div className="adicional">
                  <input
                    type="checkbox"
                    checked={addLoss}
                    onChange={handleToggleLoss}
                  />
                  <strong>Adicionar 10% para perdas na instalação</strong>
                </div>
                {addLoss && adjustedArea !== null && adjustedCaixas !== null && (
                  <p className="ajuste-info">
                    Com 10% será: <strong>{adjustedArea.toFixed(2)} m²(Totalizando {adjustedCaixas} caixas)</strong>
                  </p>
                )}
                <button className="add" onClick={increase} disabled={totalCaixas === 0}>
                  Selecionar quantidade
                </button>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default CalculoMetros;