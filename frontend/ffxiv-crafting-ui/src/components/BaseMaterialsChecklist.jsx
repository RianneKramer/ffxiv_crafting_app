import React, { useEffect, useState } from "react";
import axios from "axios";

const BaseMaterialsChecklist = () => {
  const [materials, setMaterials] = useState([]);
  const [checked, setChecked] = useState({});

  useEffect(() => {
    axios.get("http://localhost:3000/api/base-materials/batch")
      .then(res => {
        setMaterials(res.data);
        const initial = {};
        res.data.forEach(item => {
          initial[item.id] = false;
        });
        setChecked(initial);
      })
      .catch(err => {
        console.error("Failed to load materials:", err);
      });
  }, []);

  const toggleCheck = (id) => {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Base Materials</h2>
      <ul className="space-y-2">
        {materials.map((item) => (
          <li key={item.id} className="flex items-center gap-2 p-2 border rounded-lg shadow-sm bg-white">
            <input
              type="checkbox"
              checked={checked[item.id] || false}
              onChange={() => toggleCheck(item.id)}
              className="h-5 w-5"
            />
            <div>
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-gray-500">
                Needed: {Math.ceil(item.total_quantity)} • {item.source_type || "Unknown"} • {item.location_description || "No location"}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BaseMaterialsChecklist;
