import React, { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '../firebaseConfig';
import CategoryList from '../components/CategoryList';
import ItemList from '../components/ItemList';

function HomePage({ user }) {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    // Écoute en temps réel des catégories de l'utilisateur
    const q = query(collection(db, 'categories'), where('userId', '==', user.uid), orderBy('position'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cats = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setCategories(cats);
    });
    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    // Écoute en temps réel des items de la catégorie sélectionnée
    if (!selectedCategoryId) {
      setItems([]);
      return;
    }
    const q = query(
      collection(db, 'items'),
      where('userId', '==', user.uid),
      where('categoryId', '==', selectedCategoryId),
      orderBy('name')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemList = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setItems(itemList);
    });
    return () => unsubscribe();
  }, [user.uid, selectedCategoryId]);

  const handleSelectCategory = (categoryId) => {
    setSelectedCategoryId(categoryId);
  };

  const handleAddCategory = async (name) => {
    try {
      // Déterminer la position pour la nouvelle catégorie (dernière position)
      const maxPos = categories.reduce((max, cat) => (cat.position > max ? cat.position : max), -1);
      const position = maxPos + 1;
      await addDoc(collection(db, 'categories'), {
        name: name,
        userId: user.uid,
        position: position
      });
    } catch (err) {
      console.error("Erreur ajout catégorie:", err);
      alert("Impossible d'ajouter la catégorie.");
    }
  };

  const handleEditCategory = (category) => {
    const newName = prompt("Renommer la catégorie:", category.name);
    if (newName && newName.trim() !== "") {
      updateDoc(doc(db, 'categories', category.id), { name: newName.trim() })
        .catch(err => {
          console.error("Erreur mise à jour catégorie:", err);
          alert("Impossible de renommer la catégorie.");
        });
    }
  };

  const handleDeleteCategory = async (category) => {
    const confirmDelete = window.confirm(`Supprimer la catégorie "${category.name}" ?\nTous les items associés seront également supprimés.`);
    if (!confirmDelete) return;
    try {
      // Récupérer tous les items de cette catégorie
      const itemsQuery = query(collection(db, 'items'), where('userId', '==', user.uid), where('categoryId', '==', category.id));
      const itemsSnap = await getDocs(itemsQuery);
      // Batch pour supprimer items et catégorie, et mettre à jour les positions
      const batch = writeBatch(db);
      itemsSnap.forEach(docSnap => {
        batch.delete(docSnap.ref);
      });
      // Mettre à jour la position des catégories suivantes pour combler le trou
      const removedPos = category.position;
      categories.forEach(cat => {
        if (cat.position > removedPos) {
          batch.update(doc(db, 'categories', cat.id), { position: cat.position - 1 });
        }
      });
      batch.delete(doc(db, 'categories', category.id));
      await batch.commit();
      // Supprimer les images des items de Storage
      for (let docSnap of itemsSnap.docs) {
        const data = docSnap.data();
        if (data.imagePath) {
          try {
            await deleteObject(storageRef(storage, data.imagePath));
          } catch (e) {
            console.error("Erreur suppression image:", e);
          }
        }
      }
      // Si on supprimait la catégorie sélectionnée, effacer la sélection
      if (selectedCategoryId === category.id) {
        setSelectedCategoryId(null);
      }
    } catch (err) {
      console.error("Erreur suppression catégorie:", err);
      alert("Erreur lors de la suppression de la catégorie.");
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const newCats = Array.from(categories);
    const [moved] = newCats.splice(result.source.index, 1);
    newCats.splice(result.destination.index, 0, moved);
    // Mettre à jour les positions localement
    newCats.forEach((cat, idx) => { cat.position = idx; });
    setCategories(newCats);
    // Mettre à jour les positions dans Firestore
    const batch = writeBatch(db);
    newCats.forEach(cat => {
      batch.update(doc(db, 'categories', cat.id), { position: cat.position });
    });
    batch.commit().catch(err => console.error("Erreur réorganisation catégories:", err));
  };

  const handleAddItem = async (name, price, file) => {
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice)) {
      throw new Error("Prix invalide");
    }
    // Définir un chemin unique pour l'image dans Storage
    const filePath = `users/${user.uid}/categories/${selectedCategoryId}/${Date.now()}_${file.name}`;
    // Uploader l'image dans Firebase Storage
    const imageRef = storageRef(storage, filePath);
    await uploadBytes(imageRef, file);
    const imageUrl = await getDownloadURL(imageRef);
    // Ajouter le document de l'item dans Firestore
    await addDoc(collection(db, 'items'), {
      name: name,
      price: parsedPrice,
      imageUrl: imageUrl,
      imagePath: filePath,
      userId: user.uid,
      categoryId: selectedCategoryId
    });
  };

  const handleEditItem = (item) => {
    const newName = prompt("Nouveau nom pour l'item:", item.name);
    if (!newName) return;
    const newPriceStr = prompt("Nouveau prix pour l'item:", item.price);
    if (!newPriceStr) return;
    const newPrice = parseFloat(newPriceStr);
    if (isNaN(newPrice)) {
      alert("Prix invalide.");
      return;
    }
    updateDoc(doc(db, 'items', item.id), { name: newName, price: newPrice })
      .catch(err => {
        console.error("Erreur mise à jour item:", err);
        alert("Impossible de modifier l'item.");
      });
  };

  const handleDeleteItem = async (item) => {
    const confirmDelete = window.confirm(`Supprimer l'item "${item.name}" ?`);
    if (!confirmDelete) return;
    try {
      await deleteDoc(doc(db, 'items', item.id));
      if (item.imagePath) {
        await deleteObject(storageRef(storage, item.imagePath));
      }
    } catch (err) {
      console.error("Erreur suppression item:", err);
      alert("Erreur lors de la suppression de l'item.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId) || null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* En-tête avec bouton de déconnexion */}
      <header className="bg-gray-200 p-4 flex justify-between items-center">
        <span>Connecté en tant que <strong>{user.email}</strong></span>
        <button onClick={handleLogout} className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400">
          Déconnexion
        </button>
      </header>
      {/* Contenu principal: listes des catégories et items */}
      <div className="flex flex-1 flex-col md:flex-row">
        <div className="md:w-1/3 md:border-r border-gray-300">
          <CategoryList 
            categories={categories} 
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={handleSelectCategory}
            onAddCategory={handleAddCategory}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
            onDragEnd={handleDragEnd}
          />
        </div>
        <div className="md:w-2/3 flex-1">
          {selectedCategoryId ? (
            <ItemList 
              selectedCategory={selectedCategory}
              items={items}
              onAddItem={handleAddItem}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
            />
          ) : (
            <div className="p-4 text-gray-600">Sélectionnez une catégorie pour afficher les items.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
