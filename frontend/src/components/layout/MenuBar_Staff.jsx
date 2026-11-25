import React from "react";
import MenuBar from "./MenuBar";

/**
 * MenuBar_Staff: Tái sử dụng component MenuBar chuẩn hóa,
 * tự động nhận diện quyền STAFF từ localStorage và áp dụng giao diện màu ấm.
 */
const MenuBarStaff = (props) => {
  return <MenuBar {...props} />;
};

export default MenuBarStaff;
