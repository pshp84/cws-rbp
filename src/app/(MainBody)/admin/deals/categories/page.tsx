"use client";

import withAuth from "@/Components/WithAuth/WithAuth";
import { addDealCategory, deleteDealCategory, getDealCategories, getDealsByCategories, updateDealCategory } from "@/DbClient";
import { createSlug } from "@/Helper/commonHelpers";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";

const DealCategories = () => {

    const [addNewCategoryFormSubmit, setAddNewCategoryFormSubmit] = useState<boolean>(false);
    const [editCategoryFormSubmit, setEditCategoryFormSubmit] = useState<boolean>(false);
    const [categoriesLoading, setCategoriesLoading] = useState<boolean>(false);
    const [addCategoryName, setAddCategoryName] = useState("");
    const [addCategorySlug, setAddCategorySlug] = useState("");
    const [editCategoryID, setEditCategoryID] = useState<number>();
    const [editCategoryName, setEditCategoryName] = useState("");
    const [editCategorySlug, setEditCategorySlug] = useState("");
    const [categories, setCategories] = useState<any[]>([]);
    const [modal, setModal] = useState(false);

    const toggleModel = () => setModal(!modal);

    const loadCategories = async () => {
        setCategoriesLoading(true);
        let dealCategories = await getDealCategories();
        if (dealCategories) {
            const updatedCategories = await Promise.all(
                dealCategories.map(async (dealCategory) => {
                    const dealData = await getDealsByCategories([dealCategory.category_id]);
                    return { ...dealCategory, dealData };
                })
            );
            setCategories(updatedCategories);
        }
        setCategoriesLoading(false);
    };

    const saveNewCategory = async (event: React.FormEvent) => {
        event.preventDefault();
        if (addCategoryName == "") {
            toast.error("Category name is require");
            return false;
        }
        if (addCategorySlug == "") {
            toast.error("Category slug is require");
            return false;
        }

        setAddNewCategoryFormSubmit(true);

        const addDealCategoryStatus = await addDealCategory({
            name: addCategoryName,
            slug: addCategorySlug
        });

        if (!addDealCategoryStatus) {
            toast.error("Something is wrong! please try again");
            return false;
        }

        loadCategories();
        resetCategoryForms();
        toast.success("Category added successfully");
        setAddNewCategoryFormSubmit(false);
        return true;
    }

    const saveEditCategory = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!editCategoryID || editCategoryID == 0) {
            toast.error("Category ID is require");
            return false;
        }
        if (editCategoryName == "") {
            toast.error("Category name is require");
            return false;
        }
        if (editCategorySlug == "") {
            toast.error("Category slug is require");
            return false;
        }

        setEditCategoryFormSubmit(true);

        const editDealCategoryStatus = await updateDealCategory(editCategoryID, {
            name: editCategoryName,
            slug: editCategorySlug
        });

        if (!editDealCategoryStatus) {
            setModal(false);
            toast.error("Something is wrong! please try again");
            return false;
        }

        loadCategories();
        resetCategoryForms();
        toast.success("Category updated successfully");
        setEditCategoryFormSubmit(false);
        setModal(false);
        return true;
    }

    const deleteCategory = async (categoryID: number) => {
        setCategoriesLoading(true);
        const deleteCategoryStatus = await deleteDealCategory(categoryID);
        if (!deleteCategoryStatus) {
            toast.error("Something is wrong! please try again");
            return false;
        }
        await loadCategories();
        setCategoriesLoading(false);
        toast.success("Category deleted successfully");
        return true;
    }

    const resetCategoryForms = () => {
        setAddCategoryName("");
        setAddCategorySlug("");
        setEditCategoryID(0);
        setEditCategoryName("");
        setEditCategorySlug("");
    }

    useEffect(() => {
        const slugText = createSlug(addCategoryName);
        setAddCategorySlug(slugText);
    }, [addCategoryName]);

    useEffect(() => {
        const slugText = createSlug(editCategoryName);
        setEditCategorySlug(slugText);
    }, [editCategoryName]);

    useEffect(() => {
        loadCategories();
    }, []);

    return <div className="deal-categories col-12">

        <div className="row">
            <div className="col-md-4">

                <form onSubmit={saveNewCategory} className="card overflow-hidden position-relative">
                    {addNewCategoryFormSubmit &&
                        <div className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center z-3" style={{ backgroundColor: "rgba(255,255,255, 0.8)" }}>
                            Adding category...
                        </div>
                    }
                    <div className="card-header">Add New Category</div>
                    <div className="card-body">
                        <div className="mb-3">
                            <label htmlFor="addCategoryName">Name</label>
                            <input type="text" className="form-control" id="addCategoryName" required onChange={(e) => setAddCategoryName(e.target.value)} value={addCategoryName} />
                        </div>
                        <div className="mb-0">
                            <label htmlFor="addCategorySlug">Slug</label>
                            <input type="text" className="form-control" id="addCategorySlug" required onChange={(e) => setAddCategorySlug(e.target.value)} value={addCategorySlug} />
                        </div>
                    </div>
                    <div className="card-footer d-flex gap-2">
                        <button type="submit" className="btn btn-primary">Save</button>
                        <button type="button" className="btn btn-outline-primary" onClick={resetCategoryForms}>Reset</button>
                    </div>
                </form>

            </div>
            <div className="col-md-8">
                <div className="card overflow-hidden">

                    <div className="table-responsive">
                        {categoriesLoading &&
                            <div className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: "rgba(255,255,255, 0.8)" }}>
                                Loading please wait...
                            </div>
                        }
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ width: "50px" }} className="text-center">#</th>
                                    <th>Name</th>
                                    <th>Slug</th>
                                    <th style={{ width: "50px" }}>Deals</th>
                                    <th style={{ width: "75px" }} className="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.length <= 0 &&
                                    <tr>
                                        <td className="text-center" colSpan={5}>Categories not found! please add first category</td>
                                    </tr>
                                }
                                {categories.length > 0 &&
                                    categories.map((category, categoryIndex) => {
                                        return <tr key={`category-row-${categoryIndex}`}>
                                            <td className="text-center">{category.category_id}</td>
                                            <td>{category.name}</td>
                                            <td>{category.slug}</td>
                                            <td>{(category.dealData) ? category.dealData.length : 0}</td>
                                            <td>
                                                <div className="d-flex gap-2 justify-content-center align-items-center">
                                                    <a href="#" onClick={(e) => {
                                                        e.preventDefault();
                                                        setEditCategoryID(category.category_id);
                                                        setEditCategoryName(category.name);
                                                        setEditCategorySlug(category.slug);
                                                        setModal(true);
                                                    }} title="Edit Category"><i className="fa fa-pencil"></i></a>
                                                    <a href="#" onClick={(e) => {
                                                        e.preventDefault();
                                                        if (confirm("Are you sure?")) deleteCategory(category.category_id);
                                                    }} title="Delete Category"><i className="fa fa-trash-o"></i></a>
                                                </div>
                                            </td>
                                        </tr>
                                    })
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <Modal size="sm" isOpen={modal} toggle={toggleModel}>
            <ModalHeader>Edit Category</ModalHeader>
            <ModalBody className="position-relative overflow-hidden">
                {editCategoryFormSubmit &&
                    <div className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center z-3 top-0 start-0" style={{ backgroundColor: "rgba(255,255,255, 0.8)" }}>
                        Updating category...
                    </div>
                }
                <div className="mb-3">
                    <label htmlFor="editCategoryName">Name</label>
                    <input type="text" className="form-control" id="editCategoryName" required onChange={(e) => setEditCategoryName(e.target.value)} value={editCategoryName} />
                </div>
                <div className="mb-0">
                    <label htmlFor="editCategorySlug">Slug</label>
                    <input type="text" className="form-control" id="editCategorySlug" required onChange={(e) => setEditCategorySlug(e.target.value)} value={editCategorySlug} />
                </div>
            </ModalBody>
            <ModalFooter className="position-relative overflow-hidden">
                {editCategoryFormSubmit &&
                    <div className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center z-3 top-0 start-0" style={{ backgroundColor: "rgba(255,255,255, 0.8)" }}>&nbsp;</div>
                }
                <button type="button" className="btn btn-outline-primary" onClick={() => setModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={saveEditCategory}>Save</button>
            </ModalFooter>
        </Modal>

    </div>;
};

export default withAuth(DealCategories);
