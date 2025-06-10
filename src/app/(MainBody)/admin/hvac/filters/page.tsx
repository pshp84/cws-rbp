"use client";
import React, { useEffect, useState } from "react";
import {
  getAttributeValues,
  addAttribute,
  addAttributeValues,
  updateAttributeValue,
  productStockStatus,
  updateProduct,
  addProductAttributeRelations,
  productAttributeRelation,
  getProduct,
  addProduct,
  productDataInterface,
  updateAttribute,
  getAttributes,
  getVariationByAttributes,
  updateProductMeta,
  getProductAttributeRelation,
  productStatus,
  getProductMeta,
} from "@/DbClient";
import { hvacFilterProductInterface, ProductType } from "@/Types/HVACFilter";
import { toast } from "react-toastify";

type ProductAttributeValues = {
  attributeValue: string;
  attribute_value_id: number;
};

type ProductAttribute = {
  optionName: string;
  optionValues: string[];
  attributeId?: number;
  attributeValues?: ProductAttributeValues[];
};

type ProductVariation = {
  variations: {
    attributeName: string;
    attributeValue: string;
    attributeValueID?: number;
    attributeID?: number;
  }[];
  price: number;
  stockStatus: string;
  variationProductID?: number;
};

type ProductSelectedAttribute = {
  attributeValueID: number;
};

const HVACFilters = () => {
  const [productOptions, setProductOptions] = useState<ProductAttribute[]>([]);
  const [productPriceConfigurations, setPriceConfigurations] = useState<
    ProductVariation[]
  >([]);
  const [products, setProducts] = useState<hvacFilterProductInterface>();

  const addNewFilterOption = () => {
    setProductOptions([
      ...productOptions,
      { optionName: "", optionValues: [] },
    ]);
  };

  const generateProductVariations = () => {
    const variations: ProductVariation[] = [];

    // Recursive function to generate combinations
    const buildCombinations = async (
      options: ProductAttribute[], // Changed to ProductOption type to match your productOptions structure
      currentCombination: { [key: string]: string },
      index: number
    ) => {
      if (index === options.length) {
        // Convert currentCombination to the desired format with attributeId and attribute_value_id
        const formattedCombination = {
          variations: Object.entries(currentCombination).map(
            ([name, value]) => {
              // Find the matching option and its attributeId and attribute_value_id
              const option: any = options.find(
                (opt) => opt.optionName === name
              );
              const valueObj = option.attributeValues.find(
                (val: { attributeValue: string }) =>
                  val.attributeValue === value
              );

              return {
                attributeName: name,
                attributeValue: value,
                attributeID: option?.attributeId, // Add attributeId
                attributeValueID: valueObj?.attribute_value_id, // Add attribute_value_id
              };
            }
          ),
          price: Math.floor((Math.random() * 100) + 1), // Adjust your price logic as needed
          stockStatus: "In Stock",
          variationProductID: 0,
        };

        if (formattedCombination.variations) {
          const selectedAttributesData = formattedCombination.variations.map(
            (data) => parseInt(data.attributeValueID)
          );
          // if (selectedAttributesData) {
          //   const variationProduct: any = await getVariationByAttributes(25, selectedAttributesData);
          //   if (variationProduct) {
          //     const { product_id: variationProductID } = variationProduct;
          //     formattedCombination.variationProductID = variationProductID;
          //   }
          //   console.log("formattedCombination", formattedCombination);
          // }
        }
        variations.push(formattedCombination);
        return;
      }

      const currentOption = options[index];
      for (const value of currentOption.optionValues) {
        await buildCombinations(
          options,
          { ...currentCombination, [currentOption.optionName]: value },
          index + 1
        );
      }
    };

    // Start recursive combination building
    buildCombinations(productOptions, {}, 0);
    setPriceConfigurations(variations);
  };

  const fetchProducts = async () => {
    try {
      const result = await getProduct(25, true);
      setProducts(result);
    } catch (error) {}
  };

  const fetchAttributes = async () => {
    try {
      const attributesResponse = await getAttributes();
      if (attributesResponse && Array.isArray(attributesResponse)) {
        const updatedProductOptions = [];
        for (let attribute of attributesResponse) {
          const { attribute_id, attribute_name } = attribute;
          const valuesResponse = await getAttributeValues(attribute_id);
          const optionValues =
            valuesResponse && Array.isArray(valuesResponse)
              ? valuesResponse.map((value) => value.attribute_value)
              : [];
          const optionValueId =
            valuesResponse && Array.isArray(valuesResponse)
              ? valuesResponse.map((value) => value.attribute_value_id)
              : [];
          const combinedValues = optionValues.map((value, index) => ({
            attributeValue: value,
            attribute_value_id: optionValueId[index],
          }));
          updatedProductOptions.push({
            optionName: attribute_name,
            optionValues: optionValues,
            attributeId: attribute_id,
            attributeValues: combinedValues,
          });
        }
        setProductOptions(updatedProductOptions);
      } else {
        console.error("No attributes found");
      }
    } catch (error) {
      console.error("Error fetching attributes or values:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchAttributes();
  }, []);

  useEffect(() => {
    generateProductVariations();
  }, [productOptions]);

  const handleUpdateProduct = async () => {
    const addData: hvacFilterProductInterface = {
      name: products ? products?.name : "",
      slug: products ? products.name?.toLowerCase() : "",
      description: products ? products.description : "",
      productType: products!.productType as ProductType,
    };
    try {
      const result = await updateProduct(25, addData);
      if (result) {
        toast.success("Product data saved successfully.");
        fetchProducts();
      } else {
        toast.error("Something went wrong...");
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong...");
    }
  };

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    if (products) {
      const { name, value } = e.target;
      const updatedProduct = { ...products, [name]: value };
      setProducts(updatedProduct);
    }
  };

  // const extractPriceAndStockStatus = (
  //   metaData: { meta_key: string; meta_value: string }[]
  // ) => {
  //   let price_data: number = 0; // Default price as 0
  //   let stock_Status = ""; // Default stock status

  //   metaData.forEach((item) => {
  //     if (item.meta_key === "price") {
  //       price_data = Number(item.meta_value); // Convert price to a number
  //     } else if (item.meta_key === "stock_status") {
  //       stock_Status = item.meta_value;
  //     }
  //   });

  //   return { price_data, stock_Status };
  // };

  const addGenerations = async () => {
    productPriceConfigurations.forEach(async (priceConfig) => {
      const selectedAttributes: Array<number> = [];
      priceConfig.variations.forEach((variation) => {
        if (variation.attributeValueID)
          selectedAttributes.push(variation.attributeValueID);
      });
      const variationProduct: any = await getVariationByAttributes(
        25,
        selectedAttributes
      );

      const stockStatus =
        priceConfig.stockStatus === productStockStatus.inStock
          ? productStockStatus.inStock
          : productStockStatus.outOfStock;
      const price = priceConfig.price;

      if (variationProduct === null || !variationProduct) {
        const productAttributeValuesName = priceConfig.variations.map(
          (data) => data.attributeValue
        );
        const productName =
          products?.name + " - " + productAttributeValuesName.join(" - ");
        const productSlug = productName
          .replace(/[()]/g, "")
          .split(" ")
          .join("-"); // Please change it to slug
        const productData: productDataInterface = {
          name: productName,
          slug: productSlug,
          productType: ProductType.Variation,
          productParent: 25,
          productStatus: productStatus.Draft,
          isSubscription: true,
          stockStatus,
          price,
        };
        const insertedProductData = await addProduct(productData);
        if (insertedProductData) {
          const { product_id: variationID } = insertedProductData;
          // Insert Attribute Relations
          const attributeRelationData: Array<productAttributeRelation> = [];

          priceConfig.variations.forEach((variation) => {
            if (variation.attributeValueID) {
              attributeRelationData.push({
                attributeID: variation.attributeValueID,
                attributeValueID: variation.attributeValueID,
                productID: variationID,
              });
            }
          });
          await addProductAttributeRelations(attributeRelationData);

        }
      } else {
        // Update variation product
        const { product_id: variationID } = variationProduct;
        const result = await updateProductMeta(variationID, "price", price);
        const result2 = await updateProductMeta(
          variationID,
          "stock_status",
          stockStatus
        );

        if (result && result2) {
          toast.success("Product updated successfully");
        } else {
          toast.error("Something went wrong");
        }
      }
    });
  };

  const saveFilterOptions = async () => {
    try {
      let updateSuccessful = true;
      productOptions.forEach(async (el) => {
        if ((el.attributeId ?? null) === null) {
          const newAttribute = await addAttribute(el.optionName);
          const newAttributeId = newAttribute && newAttribute.attribute_id;

          const newAttributeValues = el.optionValues.map((value) => ({
            attributeID: newAttributeId,
            attributeValue: value,
          }));
          const newAttributeValue = await addAttributeValues(
            newAttributeValues
          );
          if (newAttributeValue) {
          } else {
          }
          fetchAttributes();
        } else if (el.attributeId !== null) {
          const validAttributeId = el.attributeId ?? -1;
          await updateAttribute(validAttributeId, el.optionName);
          el.attributeValues?.forEach(async (item, index) => {
            const updatedValue = el.optionValues[index];
            if (updatedValue) {
              const result2 = await updateAttributeValue(
                item.attribute_value_id,
                updatedValue
              );
              if (result2) {
                updateSuccessful = true;
                fetchAttributes();
              } else {
                updateSuccessful = false;
              }
            }
          });
        }
      });
      if (updateSuccessful) {
        toast.success("Options saved successfully.");
      } else {
        toast.error("Something went wrong.");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-8 col-lg-6">
          <div className="card">
            <div className="card-header d-flex align-items-center">
              <h4 className="flex-fill">HVAC Filters Configurations</h4>

              <button
                type="button"
                onClick={handleUpdateProduct}
                className="btn btn-primary btn-sm"
              >
                Save
              </button>
            </div>
            <div className="card-body">
              <div className="">
                <div className="hvac-filter-details mb-4">
                  <div className="mb-3">
                    <label
                      htmlFor="productTitleInput"
                      className="form-check-label"
                    >
                      Titles
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="productTitleInput"
                      name="name"
                      value={products && products.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label
                      htmlFor="productDescriptionInput"
                      className="form-check-label"
                    >
                      Description
                    </label>
                    <textarea
                      className="form-control"
                      id="productDescriptionInput"
                      rows={4}
                      name="description"
                      value={products && products.description}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                </div>

                <div className="hvac-filter-options border-bottom mb-4 pb-3">
                  <div className="d-flex align-items-center gap-2">
                    <h5 className="flex-fill">Options</h5>
                    <button
                      type="button"
                      onClick={addNewFilterOption}
                      className="btn btn-sm btn-outline-primary"
                    >
                      Add new
                    </button>
                  </div>

                  {productOptions.length > 0 && (
                    <div className="hvac-filter-options-container">
                      {productOptions.map((option, optionIndex) => (
                        <div
                          key={`productOption-${optionIndex}`}
                          className="hvac-filter-option mb-3 border-bottom pb-4"
                        >
                          <div className="row">
                            <div className="col-3">
                              <label
                                htmlFor={`productOptionNameInput-${optionIndex}`}
                                className="form-check-label"
                              >
                                Name:
                              </label>
                              <input
                                type="text"
                                className="form-control mb-2"
                                id={`productOptionNameInput-${optionIndex}`}
                                onChange={(e) => {
                                  const newProductOptions = [...productOptions];
                                  newProductOptions[optionIndex] = {
                                    ...newProductOptions[optionIndex],
                                    optionName: e.target.value,
                                  };
                                  setProductOptions(newProductOptions);
                                }}
                                value={option.optionName}
                                placeholder="e.g., size or type"
                              />
                              <a
                                href="#"
                                className="text-danger"
                                onClick={(e) => {
                                  e.preventDefault();
                                  const newProductOptions =
                                    productOptions.filter(
                                      (_, index) => index !== optionIndex
                                    );
                                  setProductOptions(newProductOptions);
                                }}
                              >
                                &times; Remove
                              </a>
                            </div>
                            <div className="col-9">
                              <label
                                htmlFor={`productOptionValuesInput-${optionIndex}`}
                                className="form-check-label"
                              >
                                Value(s):
                              </label>
                              <textarea
                                className="form-control"
                                id={`productOptionValuesInput-${optionIndex}`}
                                rows={4}
                                placeholder="Enter values separated by commas (e.g., Small, Medium, Large)"
                                onChange={(e) => {
                                  const valuesArray = e.target.value
                                    .split(",")
                                    .map((value) => value.trim());
                                  const newProductOptions = [...productOptions];
                                  newProductOptions[optionIndex] = {
                                    ...newProductOptions[optionIndex],
                                    optionValues: valuesArray,
                                  };
                                  setProductOptions(newProductOptions);
                                }}
                                value={option.optionValues.join(", ")}
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="d-flex align-items-center gap-2">
                        <button
                          type="button"
                          onClick={saveFilterOptions}
                          className="btn btn-primary btn-sm"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() =>
                            setProductOptions([
                              { optionName: "", optionValues: [] },
                            ])
                          }
                        >
                          Clear Options
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {productOptions.length > 0 && (
                  <div className="hvac-filter-configurations mt-5">
                    <div className="d-flex align-items-center gap-2">
                      <h5 className="flex-fill">Price Configurations</h5>
                      {productOptions.length >= 1 &&
                        productOptions[0].optionValues.length > 0 && (
                          <button
                            type="button"
                            onClick={generateProductVariations}
                            className="btn btn-sm btn-outline-primary"
                          >
                            Generate configurations
                          </button>
                        )}
                    </div>

                    {(productOptions.length <= 0 ||
                      productOptions[0].optionValues.length <= 0) && (
                      <p>
                        Add some options in above section to generate price
                        configurations.
                      </p>
                    )}

                    {productOptions.length >= 1 &&
                      productOptions[0].optionValues.length > 0 &&
                      productPriceConfigurations.map(
                        (priceConfig, priceConfigIndex) => {
                          return (
                            <>
                              <div
                                key={`priceConfigIndex-${priceConfigIndex}`}
                                className="card border mt-4 mb-0"
                              >
                                <div className="card-header">
                                  <div className="d-flex align-items-center gap-2">
                                    <div className="d-flex align-items-center">
                                      {priceConfig.variations.length > 0 &&
                                        priceConfig.variations.map(
                                          (variation, variationIndex) => {
                                            return (
                                              <span
                                                key={`variationIndex-${variationIndex}`}
                                                className="badge bg-primary"
                                                title={variation.attributeName}
                                              >
                                                {variation.attributeValue}
                                              </span>
                                            );
                                          }
                                        )}
                                    </div>
                                  </div>
                                </div>
                                <div className="card-body">
                                  <div className="d-flex align-items-center gap-2">
                                    <div className="w-50">
                                      <label className="form-check-label">
                                        Price
                                      </label>
                                      <input
                                        type="string"
                                        value={priceConfig.price}
                                        onChange={(e) => {
                                          const newProductConfigOptions = [
                                            ...productPriceConfigurations,
                                          ];
                                          newProductConfigOptions[
                                            priceConfigIndex
                                          ] = {
                                            ...newProductConfigOptions[
                                              priceConfigIndex
                                            ],
                                            price: Number(e.target.value),
                                          };
                                          setPriceConfigurations(
                                            newProductConfigOptions
                                          );
                                        }}
                                        className="form-control form-control-sm"
                                      />
                                    </div>
                                    <div className="w-50">
                                      <label className="form-check-label">
                                        Stock
                                      </label>
                                      <select
                                        value={priceConfig.stockStatus}
                                        onChange={(e) => {
                                          const newProductConfigOptions = [
                                            ...productPriceConfigurations,
                                          ];
                                          newProductConfigOptions[
                                            priceConfigIndex
                                          ] = {
                                            ...newProductConfigOptions[
                                              priceConfigIndex
                                            ],
                                            stockStatus: e.target.value,
                                          };
                                          setPriceConfigurations(
                                            newProductConfigOptions
                                          );
                                        }}
                                        className="form-control form-control-sm w-100"
                                      >
                                        <option value={"In stock"}>
                                          {productStockStatus.inStock}
                                        </option>
                                        <option value={"Out of stock"}>
                                          {productStockStatus.outOfStock}
                                        </option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </>
                          );
                        }
                      )}
                  </div>
                )}
              </div>
            </div>
            <div className="text-end card-footer">
              <button
                onClick={addGenerations}
                type="button"
                className="btn btn-primary btn-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HVACFilters;
