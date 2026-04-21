const { Category } = require('../models');

// @route GET /api/categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json({ categories });
  } catch (error) {
    console.error('getCategories error:', error);
    res.status(500).json({ error: 'Server error fetching categories' });
  }
};

// @route POST /api/categories
const createCategory = async (req, res) => {
  const { name, icon } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    const category = await Category.create({ name, icon });
    res.status(201).json({ message: 'Category created successfully', category });
  } catch (error) {
    console.error('createCategory error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Category already exists' });
    }
    res.status(500).json({ error: 'Server error creating category' });
  }
};

// @route PUT /api/categories/:id
const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, icon } = req.body;

  try {
    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await category.update({ name, icon });
    res.json({ message: 'Category updated successfully', category });
  } catch (error) {
    console.error('updateCategory error:', error);
    res.status(500).json({ error: 'Server error updating category' });
  }
};

// @route DELETE /api/categories/:id
const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await category.destroy();
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('deleteCategory error:', error);
    res.status(500).json({ error: 'Server error deleting category' });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
