import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MasterDataState } from "./types";

const initialState: MasterDataState = {
  brands: ["Apple", "Samsung", "Google", "OnePlus"],
  models: [
    "iPhone 13 Pro",
    "iPhone 14 Pro Max",
    "iPhone 15 Pro",
    "S22 Ultra",
    "S23 Ultra",
    "Pixel 7 Pro",
  ],
  ramOptions: ["4GB", "6GB", "8GB", "12GB", "16GB"],
  storageOptions: ["64GB", "128GB", "256GB", "512GB", "1TB"],
  colorOptions: [
    "Graphite",
    "Black",
    "White",
    "Silver",
    "Gold",
    "Sierra Blue",
    "Phantom Black",
    "Natural Titanium",
    "Purple",
    "Mint",
  ],
  issueTags: [
    "Screen Scratch",
    "Battery Degraded",
    "Back Glass Crack",
    "Camera Dust",
    "Mint Condition",
    "Grade A",
    "Grade B",
    "Open Box",
  ],
};

const masterDataSlice = createSlice({
  name: "masterData",
  initialState,
  reducers: {
    addBrand: (state, action: PayloadAction<string>) => {
      if (!state.brands.includes(action.payload))
        state.brands.push(action.payload);
    },
    addModel: (state, action: PayloadAction<string>) => {
      if (!state.models.includes(action.payload))
        state.models.push(action.payload);
    },
    addRamOption: (state, action: PayloadAction<string>) => {
      if (!state.ramOptions.includes(action.payload))
        state.ramOptions.push(action.payload);
    },
    addStorageOption: (state, action: PayloadAction<string>) => {
      if (!state.storageOptions.includes(action.payload))
        state.storageOptions.push(action.payload);
    },
    addColorOption: (state, action: PayloadAction<string>) => {
      if (!state.colorOptions.includes(action.payload))
        state.colorOptions.push(action.payload);
    },
    addIssueTag: (state, action: PayloadAction<string>) => {
      if (!state.issueTags.includes(action.payload))
        state.issueTags.push(action.payload);
    },
  },
});

export const {
  addBrand,
  addModel,
  addRamOption,
  addStorageOption,
  addColorOption,
  addIssueTag,
} = masterDataSlice.actions;
export default masterDataSlice.reducer;
