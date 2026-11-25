import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  
  // SARALÖWE has one art-directed look: no light/dark switching.
  dataTheme: "light",
  dataLoader: localStorage.getItem("dataLoader") || "enable",
  isRtl: localStorage.getItem("rtl") || false,
};

const themeSettingSlice = createSlice({
  name: "themeSetting",
  initialState,
  reducers: {
   
    
    setLoader: (state, action) => {
      state.dataLoader = action.payload;
      localStorage.setItem("dataLoader", action.payload);
      document.documentElement.setAttribute("data-loader", action.payload);
    },
    setRtl: (state, action) => {
      state.isRtl = action.payload;
      localStorage.setItem("rtl", action.payload);
      document.body.setAttribute("class", action.payload);
    },
    resetAllMode: (state: any) => {

      state.dataTheme = "light";
      state.dataLoader = "enable";
      state.isRtl=""
      localStorage.setItem("rtl", "");
    },
  },
});

export const {
  resetAllMode,
  setLoader,
  setRtl,
} = themeSettingSlice.actions;

export default themeSettingSlice.reducer;
