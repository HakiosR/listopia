import React, { useState } from 'react';

function ItemList({ selectedCategory, items, onAddItem, onEditItem, onDeleteItem }) {
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemFile, setItemFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemName || !itemPrice || !itemFile) {
      alert("Veuillez remplir le nom, le prix et choisir une image.");
      return;
    }
    // Appeler la fonction parent pour ajouter l'item
    try {
      await onAddItem(itemName, itemPrice, itemFile);
    } catch (err) {
      console.error(err);
      alert(err);
    }
    // Réinitialiser le formulaire d'ajout
    setItemName('');
    setItemPrice('');
    setItemFile(null);
    setFileInputKey(prevKey => prevKey + 1);  // reset file input
  };

  return (
    <div className="p-4">
      <h3 className="text-xl font-semibold mb-2">
        Items {selectedCategory ? `de ${selectedCategory.name}` : ''}
      </h3>
      {/* Formulaire d'ajout d'un nouvel item */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex flex-wrap items-end space-x-2 mb-2">
          <div className="flex-grow">
            <label className="block text-sm mb-1">Nom de l'item:</label>
            <input 
              type="text" 
              value={itemName} 
              onChange={(e) => setItemName(e.target.value)} 
              className="w-full px-3 py-2 border rounded" 
              placeholder="Nom de l'item" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Prix:</label>
            <input 
              type="number" 
              value={itemPrice} 
              onChange={(e) => setItemPrice(e.target.value)} 
              step="0.01" 
              className="w-24 px-3 py-2 border rounded" 
              placeholder="Prix" 
              required 
            />
          </div>
        </div>
        <div className="flex items-end space-x-2">
          <div className="flex-grow">
            <label className="block text-sm mb-1">Image:</label>
            <input 
              key={fileInputKey}
              type="file" 
              onChange={(e) => setItemFile(e.target.files[0] || null)} 
              className="w-full"
              accept="image/*"
              required 
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Ajouter
          </button>
        </div>
      </form>
      {/* Liste des items existants */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map(item => (
          <div key={item.id} className="border rounded p-3 bg-white">
            <img src={item.imageUrl} alt={item.name} className="h-32 w-full object-cover mb-2 rounded" />
            <div className="flex justify-between items-center mb-1">
              <div className="font-semibold">{item.name}</div>
              <div>{item.price} €</div>
            </div>
            <div className="text-sm text-gray-700">
              <button 
                onClick={() => onEditItem(item)} 
                className="mr-4 text-blue-600 hover:underline"
              >
                Éditer
              </button>
              <button 
                onClick={() => onDeleteItem(item)} 
                className="text-red-600 hover:underline"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-gray-600 col-span-full">Aucun item pour cette catégorie.</p>
        )}
      </div>
    </div>
  );
}

export default ItemList;
