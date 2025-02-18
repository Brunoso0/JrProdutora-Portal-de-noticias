import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import "../styles/SortableItem.css";

const SortableItem = ({ id, title, image, category, isMain }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={isMain ? "order-main-article" : "order-article"}>
      {image && <img src={image} alt={title} />}
      <div className="order-tag">{category}</div>
      <h3 className="order-title">{title}</h3>
    </div>
  );
};

export default SortableItem;
