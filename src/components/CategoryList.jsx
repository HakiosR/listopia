import React, { useState } from 'react';
import { DragDropContext, Draggable } from 'react-beautiful-dnd';
import StrictModeDroppable from './StrictModeDroppable';

function CategoryList({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onDragEnd,
}) {
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (name) {
      onAddCategory(name);
      setNewCategoryName('');
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md text-black">
      <h3 className="text-2xl font-semibold mb-4">Catégories</h3>

      <form onSubmit={handleAdd} className="mb-4 flex gap-2">
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="Nouvelle catégorie"
          className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Ajouter
        </button>
      </form>

      <DragDropContext onDragEnd={onDragEnd}>
        <StrictModeDroppable droppableId="categories">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {categories.map((cat, index) => (
                <Draggable key={cat.id} draggableId={cat.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      onClick={() => onSelectCategory(cat.id)}
                      style={{
                        ...provided.draggableProps.style,
                        userSelect: "none",
                        backgroundColor:
                          selectedCategoryId === cat.id
                            ? "#ebf8ff"
                            : snapshot.isDragging
                            ? "#f0f0f0"
                            : "white",
                        color: 'black'
                      }}
                      className="p-3 rounded-md border border-gray-200 shadow-sm flex justify-between items-center cursor-pointer transition"
                    >
                      <span className="font-medium truncate">{cat.name}</span>
                      <div className="space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditCategory(cat);
                          }}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Éditer
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCategory(cat);
                          }}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </StrictModeDroppable>
      </DragDropContext>
    </div>
  );
}

export default CategoryList;
