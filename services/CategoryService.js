const Category = require("../models/Category");
const User = require("../models/User");

class CategoryService {
    static async getAll(){
        return Category.find({
            isActive: true
        })
    }
    static async create(data, user){
        const { name, parent } = data;
        const { idUser } = user;

        const currentUser = await User.findById(idUser);
        if(!currentUser) throw new Error("User not found");

        const categorieParent = await Category.findById(parent);

        const category = new Category({
            name: name,
            parent: categorieParent,
            createdBy: currentUser
        })

        await category.save()
        return category;
    }
}

module.exports = CategoryService;