const Category = require("../models/Category");
const User = require("../models/User");
const Shop = require("../models/Shop");

class CategoryService {
    static async getAll(){
        return Category.find().populate("parent", "name")
        .sort({ creationDate: -1 });
        //.populate("createdBy", "firstName name email");
    }
    
    static async getAllActive(){ // for front-office
        return Category.find({ isActive: true }).select("name description _id")
        .sort({ creationDate: -1 });
    }

    static async delete(id){
        const category = await Category.findByIdAndDelete(id);
        if(!category) throw new Error("Category not found");
        return category;
    }
    
    static async update(id, data, user){
        const { name, parent, description, isActive} = data;
        const { id: userId } = user;

        const currentUser = await User.findById(userId);
        if(!currentUser) throw new Error("User not found");

        const category = await Category.findById(id);
        if(!category) throw new Error("Category not found");

        // After — skips the query entirely if parent is falsy
        const categorieParent = parent ? await Category.findById(parent) : null;
        
        Object.assign(category, {
            name: name,
            parent: categorieParent,
            isActive: isActive,
            description: description,
            updatedBy: currentUser
        });

        return await category.save();
    }

    static async create(data, user){
        const { name, parent, status, description, shop } = data;
        const { id } = user;

        const currentUser = await User.findById(id);
        if(!currentUser) throw new Error("User not found");

        const targetShop = await Shop.findById(shop);
        if(!targetShop) throw new Error("Shop not found");

        // After — skips the query entirely if parent is falsy
        const categorieParent = parent ? await Category.findById(parent) : null;
        const category = new Category({
            name: name,
            parent: categorieParent,
            createdBy: currentUser,
            isActive: status,
            description: description,
            // shop: targetShop
        })

        await category.save()
        console.log(category)
        return category;
    }
    static async getAllByShop(shopId) {
        return Category.find()
            .populate("parent", "name")
            .sort({ creationDate: -1 });
    }
}

module.exports = CategoryService;