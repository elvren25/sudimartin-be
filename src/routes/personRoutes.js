const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const Family = require("../models/Family");
const Person = require("../models/Person");
const Marriage = require("../models/Marriage");
const Relationship = require("../models/Relationship");
const { PRIVACY_TYPE, HTTP_STATUS, USER_ROLE } = require("../config/constants");

/**
 * ============================================
 * PERSON ROUTES (NEW)
 * ============================================
 */

/**
 * POST /api/families/:id/persons - Add person to family
 */
router.post("/:id/persons", verifyToken, async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);

    if (!family) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Family not found",
      });
    }

    // Check permission (TEMPORARILY DISABLED FOR TESTING)
    // TODO: Re-enable permission check after testing
    // if (family.admin_id !== req.user.id && req.user.role !== USER_ROLE.ADMIN) {
    //   return res.status(HTTP_STATUS.FORBIDDEN).json({
    //     success: false,
    //     message: "You do not have permission to add persons to this family",
    //   });
    // }

    const { nama_depan, gender } = req.body;

    if (!nama_depan || !gender) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "nama_depan and gender are required",
      });
    }

    console.log("=== CREATING PERSON ===");
    console.log("Family ID:", req.params.id);
    console.log("Request body:", req.body);
    console.log("Gender value:", gender, "Type:", typeof gender);

    const personData = {
      family_id: parseInt(req.params.id), // Convert to integer
      ...req.body,
    };

    console.log("Person data to create:", personData);

    const person = await Person.create(personData);

    console.log("Person created successfully:", person.id);
    console.log("========================\n");

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Person added successfully",
      data: person,
    });
  } catch (error) {
    console.error("=== ERROR ADDING PERSON ===");
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("SQL:", error.sql);
    console.error("SQL State:", error.sqlState);
    console.error("Full stack:", error.stack);
    console.error("Request body:", req.body);
    console.error("Family ID:", req.params.id);
    console.error("User ID:", req.user?.id);
    console.error("========================\n");

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to add person",
      error: error.message,
      code: error.code,
      sqlState: error.sqlState,
    });
  }
});

/**
 * GET /api/families/:id/persons - Get all persons in a family
 */
router.get("/:id/persons", verifyToken, async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);

    if (!family) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Family not found",
      });
    }

    // Check privacy
    if (family.privacy_type === PRIVACY_TYPE.PRIVATE) {
      if (
        family.admin_id !== req.user.id &&
        req.user.role !== USER_ROLE.ADMIN
      ) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: "You do not have access to this family",
        });
      }
    }

    const persons = await Person.findByFamilyId(req.params.id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Persons retrieved successfully",
      data: persons,
    });
  } catch (error) {
    console.error("Error retrieving persons:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to retrieve persons",
      error: error.message,
    });
  }
});

/**
 * GET /api/families/:id/persons/:personId - Get specific person
 */
router.get("/:id/persons/:personId", verifyToken, async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);

    if (!family) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Family not found",
      });
    }

    // Check privacy
    if (family.privacy_type === PRIVACY_TYPE.PRIVATE) {
      if (
        family.admin_id !== req.user.id &&
        req.user.role !== USER_ROLE.ADMIN
      ) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: "You do not have access to this family",
        });
      }
    }

    const person = await Person.findById(req.params.personId);

    if (!person || person.family_id !== parseInt(req.params.id)) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Person not found",
      });
    }

    // Get additional data
    const parents = await Person.getParents(person.id);
    const children = await Person.getChildren(person.id);
    const siblings = await Person.getSiblings(person.id);
    const marriages = await Marriage.findByPersonId(person.id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Person retrieved successfully",
      data: {
        ...person,
        ayah: parents.ayah,
        ibu: parents.ibu,
        children,
        siblings,
        marriages,
      },
    });
  } catch (error) {
    console.error("Error retrieving person:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to retrieve person",
      error: error.message,
    });
  }
});

/**
 * PUT /api/families/:id/persons/:personId - Update person
 */
router.put("/:id/persons/:personId", verifyToken, async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);

    if (!family) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Family not found",
      });
    }

    // Check permission (TEMPORARILY DISABLED FOR TESTING)
    // if (family.admin_id !== req.user.id && req.user.role !== USER_ROLE.ADMIN) {
    //   return res.status(HTTP_STATUS.FORBIDDEN).json({
    //     success: false,
    //     message: "You do not have permission to add persons to this family",
    //   });
    // }

    const updated = await Person.update(req.params.personId, req.body);

    if (!updated) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Person not found",
      });
    }

    const updatedPerson = await Person.findById(req.params.personId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Person updated successfully",
      data: updatedPerson,
    });
  } catch (error) {
    console.error("Error updating person:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to update person",
      error: error.message,
    });
  }
});

/**
 * DELETE /api/families/:id/persons/:personId - Delete person
 */
router.delete("/:id/persons/:personId", verifyToken, async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);

    if (!family) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Family not found",
      });
    }

    // Check permission
    if (family.admin_id !== req.user.id && req.user.role !== USER_ROLE.ADMIN) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message:
          "You do not have permission to delete persons from this family",
      });
    }

    await Person.delete(req.params.personId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Person deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting person:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to delete person",
      error: error.message,
    });
  }
});

/**
 * ============================================
 * MARRIAGE ROUTES (NEW)
 * ============================================
 */

/**
 * POST /api/families/:id/marriages - Create marriage
 */
router.post("/:id/marriages", verifyToken, async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);

    if (!family) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Family not found",
      });
    }

    // Check permission
    if (family.admin_id !== req.user.id && req.user.role !== USER_ROLE.ADMIN) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "You do not have permission to add marriages to this family",
      });
    }

    const { suami_id, istri_id, status } = req.body;

    // At least one of suami_id or istri_id must be provided
    if (!suami_id && !istri_id) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "At least one of suami_id or istri_id is required",
      });
    }

    // Status is required
    if (!status) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Status is required",
      });
    }

    // Validate status value
    const validStatus = ["MENIKAH", "CERAI HIDUP", "CERAI MATI"];
    if (!validStatus.includes(status)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid status value",
      });
    }

    // Check if marriage already exists
    const existingMarriage = await Marriage.exists(
      req.params.id,
      suami_id,
      istri_id
    );
    if (existingMarriage) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Marriage between these persons already exists",
      });
    }

    const marriage = await Marriage.create({
      family_id: req.params.id,
      ...req.body,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Marriage created successfully",
      data: marriage,
    });
  } catch (error) {
    console.error("Error creating marriage:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to create marriage",
      error: error.message,
    });
  }
});

/**
 * GET /api/families/:id/marriages - Get all marriages in a family
 */
router.get("/:id/marriages", verifyToken, async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);

    if (!family) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Family not found",
      });
    }

    // Check privacy
    if (family.privacy_type === PRIVACY_TYPE.PRIVATE) {
      if (
        family.admin_id !== req.user.id &&
        req.user.role !== USER_ROLE.ADMIN
      ) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: "You do not have access to this family",
        });
      }
    }

    const marriages = await Marriage.findByFamilyId(req.params.id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Marriages retrieved successfully",
      data: marriages,
    });
  } catch (error) {
    console.error("Error retrieving marriages:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to retrieve marriages",
      error: error.message,
    });
  }
});

/**
 * GET /api/families/:id/marriages/:marriageId - Get specific marriage
 */
router.get("/:id/marriages/:marriageId", verifyToken, async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);

    if (!family) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Family not found",
      });
    }

    // Check privacy
    if (family.privacy_type === PRIVACY_TYPE.PRIVATE) {
      if (
        family.admin_id !== req.user.id &&
        req.user.role !== USER_ROLE.ADMIN
      ) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: "You do not have access to this family",
        });
      }
    }

    const marriage = await Marriage.findById(req.params.marriageId);

    if (!marriage || marriage.family_id !== parseInt(req.params.id)) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Marriage not found",
      });
    }

    // Get children of this marriage
    const children = await Marriage.getChildren(marriage.id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Marriage retrieved successfully",
      data: {
        ...marriage,
        children,
      },
    });
  } catch (error) {
    console.error("Error retrieving marriage:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to retrieve marriage",
      error: error.message,
    });
  }
});

/**
 * PUT /api/families/:id/marriages/:marriageId - Update marriage
 */
router.put("/:id/marriages/:marriageId", verifyToken, async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);

    if (!family) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Family not found",
      });
    }

    // Check permission
    if (family.admin_id !== req.user.id && req.user.role !== USER_ROLE.ADMIN) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message:
          "You do not have permission to update marriages in this family",
      });
    }

    const updated = await Marriage.update(req.params.marriageId, req.body);

    if (!updated) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Marriage not found",
      });
    }

    const updatedMarriage = await Marriage.findById(req.params.marriageId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Marriage updated successfully",
      data: updatedMarriage,
    });
  } catch (error) {
    console.error("Error updating marriage:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to update marriage",
      error: error.message,
    });
  }
});

/**
 * PUT /api/families/:id/marriages/:marriageId/status - Update marriage status (divorce, etc)
 */
router.put(
  "/:id/marriages/:marriageId/status",
  verifyToken,
  async (req, res) => {
    try {
      const family = await Family.findById(req.params.id);

      if (!family) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Family not found",
        });
      }

      // Check permission
      if (
        family.admin_id !== req.user.id &&
        req.user.role !== USER_ROLE.ADMIN
      ) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message:
            "You do not have permission to update marriages in this family",
        });
      }

      const { status_perkawinan, tanggal_cerai, tempat_cerai } = req.body;

      if (!status_perkawinan) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "status_perkawinan is required",
        });
      }

      const updated = await Marriage.updateStatus(
        req.params.marriageId,
        status_perkawinan,
        { tanggal_cerai, tempat_cerai }
      );

      if (!updated) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Marriage not found",
        });
      }

      const updatedMarriage = await Marriage.findById(req.params.marriageId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Marriage status updated successfully",
        data: updatedMarriage,
      });
    } catch (error) {
      console.error("Error updating marriage status:", error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to update marriage status",
        error: error.message,
      });
    }
  }
);

/**
 * DELETE /api/families/:id/marriages/:marriageId - Delete marriage
 */
router.delete("/:id/marriages/:marriageId", verifyToken, async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);

    if (!family) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Family not found",
      });
    }

    // Check permission
    if (family.admin_id !== req.user.id && req.user.role !== USER_ROLE.ADMIN) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message:
          "You do not have permission to delete marriages from this family",
      });
    }

    await Marriage.delete(req.params.marriageId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Marriage deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting marriage:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to delete marriage",
      error: error.message,
    });
  }
});

/**
 * ============================================
 * FAMILY TREE DATA (COMBINED)
 * ============================================
 */

/**
 * GET /api/families/:id/tree - Get complete family tree with persons and marriages
 */
router.get("/:id/tree", verifyToken, async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);

    if (!family) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Family not found",
      });
    }

    // Check privacy
    if (family.privacy_type === PRIVACY_TYPE.PRIVATE) {
      if (
        family.admin_id !== req.user.id &&
        req.user.role !== USER_ROLE.ADMIN
      ) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: "You do not have access to this family",
        });
      }
    }

    // Get complete tree data
    const treeData = await Person.getFamilyTreeWithMarriages(req.params.id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Family tree retrieved successfully",
      data: {
        family,
        tree: treeData,
      },
    });
  } catch (error) {
    console.error("Error retrieving family tree:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to retrieve family tree",
      error: error.message,
    });
  }
});

/**
 * GET /api/families/:id/persons/:personId/marriages - Get marriages of a person
 */
router.get(
  "/:id/persons/:personId/marriages",
  verifyToken,
  async (req, res) => {
    try {
      const family = await Family.findById(req.params.id);

      if (!family) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Family not found",
        });
      }

      // Check privacy
      if (family.privacy_type === PRIVACY_TYPE.PRIVATE) {
        if (
          family.admin_id !== req.user.id &&
          req.user.role !== USER_ROLE.ADMIN
        ) {
          return res.status(HTTP_STATUS.FORBIDDEN).json({
            success: false,
            message: "You do not have access to this family",
          });
        }
      }

      const marriages = await Marriage.findByPersonId(req.params.personId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Person marriages retrieved successfully",
        data: marriages,
      });
    } catch (error) {
      console.error("Error retrieving person marriages:", error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to retrieve person marriages",
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/families/:id/persons/:personId/children - Get children of a person
 */
router.get("/:id/persons/:personId/children", verifyToken, async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);

    if (!family) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Family not found",
      });
    }

    // Check privacy
    if (family.privacy_type === PRIVACY_TYPE.PRIVATE) {
      if (
        family.admin_id !== req.user.id &&
        req.user.role !== USER_ROLE.ADMIN
      ) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: "You do not have access to this family",
        });
      }
    }

    const children = await Person.getChildren(req.params.personId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Person children retrieved successfully",
      data: children,
    });
  } catch (error) {
    console.error("Error retrieving person children:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to retrieve person children",
      error: error.message,
    });
  }
});

module.exports = router;
