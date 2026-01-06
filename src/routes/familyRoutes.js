const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const Family = require("../models/Family");
const FamilyMember = require("../models/FamilyMember");
const Relationship = require("../models/Relationship");
const { PRIVACY_TYPE, HTTP_STATUS, USER_ROLE } = require("../config/constants");

/**
 * ============================================
 * FAMILY ROUTES
 * ============================================
 */

/**
 * POST /api/families - Create a new family (admin only)
 * Body: { nama_keluarga, deskripsi?, privacy_type, access_code?, photo_url? }
 */
router.post("/", verifyToken, async (req, res) => {
  try {
    // Only admin can create families
    if (req.user.role !== USER_ROLE.ADMIN) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Only admin users can create families",
      });
    }

    const { nama_keluarga, deskripsi, privacy_type, access_code, photo_url } =
      req.body;

    if (!nama_keluarga) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "nama_keluarga is required",
      });
    }

    // Generate access code if not provided (6 digits)
    const generatedAccessCode =
      access_code || Math.floor(100000 + Math.random() * 900000).toString();

    const family = await Family.create({
      admin_id: req.user.id,
      nama_keluarga,
      deskripsi,
      privacy_type: privacy_type || PRIVACY_TYPE.PRIVATE,
      access_code: generatedAccessCode,
      photo_url,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Family created successfully",
      data: family,
    });
  } catch (error) {
    console.error("Error creating family:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to create family",
      error: error.message,
    });
  }
});

/**
 * GET /api/families - Get all families (public + admin's own)
 */
router.get("/", verifyToken, async (req, res) => {
  try {
    let families = [];

    if (req.user.role === USER_ROLE.ADMIN) {
      // Admin sees their own families
      families = await Family.findByAdminId(req.user.id);
    } else {
      // Regular users see public families
      families = await Family.findPublic();
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Families retrieved successfully",
      data: families,
    });
  } catch (error) {
    console.error("Error retrieving families:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to retrieve families",
      error: error.message,
    });
  }
});

/**
 * GET /api/families/:id - Get specific family
 */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);

    if (!family) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Family not found",
      });
    }

    // Check privacy and access
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

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Family retrieved successfully",
      data: family,
    });
  } catch (error) {
    console.error("Error retrieving family:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to retrieve family",
      error: error.message,
    });
  }
});

/**
 * PUT /api/families/:id - Update family (admin only)
 */
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);

    if (!family) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Family not found",
      });
    }

    // Only family admin can update
    if (family.admin_id !== req.user.id && req.user.role !== USER_ROLE.ADMIN) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "You do not have permission to update this family",
      });
    }

    const updated = await Family.update(req.params.id, req.body);

    if (!updated) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Failed to update family",
      });
    }

    const updatedFamily = await Family.findById(req.params.id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Family updated successfully",
      data: updatedFamily,
    });
  } catch (error) {
    console.error("Error updating family:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to update family",
      error: error.message,
    });
  }
});

/**
 * DELETE /api/families/:id - Delete family (admin only)
 */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);

    if (!family) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Family not found",
      });
    }

    // Only family admin can delete
    if (family.admin_id !== req.user.id && req.user.role !== USER_ROLE.ADMIN) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "You do not have permission to delete this family",
      });
    }

    await Family.delete(req.params.id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Family deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting family:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to delete family",
      error: error.message,
    });
  }
});

/**
 * ============================================
 * FAMILY MEMBERS ROUTES
 * ============================================
 */

/**
 * POST /api/families/:id/members - Add family member
 */
router.post("/:id/members", verifyToken, async (req, res) => {
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
        message: "You do not have permission to add members to this family",
      });
    }

    const { nama_depan, ...memberData } = req.body;

    if (!nama_depan) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "nama_depan is required",
      });
    }

    const member = await FamilyMember.create({
      family_id: req.params.id,
      nama_depan,
      ...memberData,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Family member added successfully",
      data: member,
    });
  } catch (error) {
    console.error("Error adding family member:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to add family member",
      error: error.message,
    });
  }
});

/**
 * GET /api/families/:id/members - Get all members of a family
 */
router.get("/:id/members", verifyToken, async (req, res) => {
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

    const members = await FamilyMember.findByFamilyId(req.params.id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Family members retrieved successfully",
      data: members,
    });
  } catch (error) {
    console.error("Error retrieving family members:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to retrieve family members",
      error: error.message,
    });
  }
});

/**
 * PUT /api/families/:id/members/:memberId - Update family member
 */
router.put("/:id/members/:memberId", verifyToken, async (req, res) => {
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
        message: "You do not have permission to update members in this family",
      });
    }

    const updated = await FamilyMember.update(req.params.memberId, req.body);

    if (!updated) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Member not found",
      });
    }

    const updatedMember = await FamilyMember.findById(req.params.memberId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Family member updated successfully",
      data: updatedMember,
    });
  } catch (error) {
    console.error("Error updating family member:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to update family member",
      error: error.message,
    });
  }
});

/**
 * DELETE /api/families/:id/members/:memberId - Delete family member
 */
router.delete("/:id/members/:memberId", verifyToken, async (req, res) => {
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
          "You do not have permission to delete members from this family",
      });
    }

    await FamilyMember.delete(req.params.memberId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Family member deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting family member:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to delete family member",
      error: error.message,
    });
  }
});

/**
 * ============================================
 * RELATIONSHIPS ROUTES
 * ============================================
 */

/**
 * POST /api/families/:id/relationships - Create relationship
 */
router.post("/:id/relationships", verifyToken, async (req, res) => {
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
          "You do not have permission to add relationships to this family",
      });
    }

    const { member1_id, member2_id, relationship_type } = req.body;

    if (!member1_id || !member2_id || !relationship_type) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "member1_id, member2_id, and relationship_type are required",
      });
    }

    const relationship = await Relationship.create({
      family_id: req.params.id,
      ...req.body,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Relationship created successfully",
      data: relationship,
    });
  } catch (error) {
    console.error("Error creating relationship:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to create relationship",
      error: error.message,
    });
  }
});

/**
 * GET /api/families/:id/relationships - Get all relationships
 */
router.get("/:id/relationships", verifyToken, async (req, res) => {
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

    const relationships = await Relationship.findByFamilyId(req.params.id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Relationships retrieved successfully",
      data: relationships,
    });
  } catch (error) {
    console.error("Error retrieving relationships:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to retrieve relationships",
      error: error.message,
    });
  }
});

/**
 * PUT /api/families/:id/relationships/:relationshipId - Update relationship
 */
router.put(
  "/:id/relationships/:relationshipId",
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
            "You do not have permission to update relationships in this family",
        });
      }

      const updated = await Relationship.update(
        req.params.relationshipId,
        req.body
      );

      if (!updated) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Relationship not found",
        });
      }

      const updatedRelationship = await Relationship.findById(
        req.params.relationshipId
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Relationship updated successfully",
        data: updatedRelationship,
      });
    } catch (error) {
      console.error("Error updating relationship:", error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to update relationship",
        error: error.message,
      });
    }
  }
);

/**
 * DELETE /api/families/:id/relationships/:relationshipId - Delete relationship
 */
router.delete(
  "/:id/relationships/:relationshipId",
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
            "You do not have permission to delete relationships from this family",
        });
      }

      await Relationship.delete(req.params.relationshipId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Relationship deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting relationship:", error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to delete relationship",
        error: error.message,
      });
    }
  }
);

/**
 * PUT /api/families/:id/canvas-layout - Save canvas layout
 */
router.put("/:id/canvas-layout", verifyToken, async (req, res) => {
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
        message: "You do not have permission to update this family",
      });
    }

    await Family.updateCanvasLayout(req.params.id, req.body);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Canvas layout saved successfully",
    });
  } catch (error) {
    console.error("Error saving canvas layout:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to save canvas layout",
      error: error.message,
    });
  }
});

/**
 * POST /api/families/:id/verify-access - Verify access code for a family
 * Body: { access_code }
 */
router.post("/:id/verify-access", async (req, res) => {
  try {
    const { access_code } = req.body;

    if (!access_code) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Kode akses harus diisi",
      });
    }

    const family = await Family.verifyAccessCode(req.params.id, access_code);

    if (!family) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Kode akses salah",
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Kode akses valid",
      data: family,
    });
  } catch (error) {
    console.error("Error verifying access code:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Gagal memverifikasi kode akses",
      error: error.message,
    });
  }
});

/**
 * POST /api/families/verify-by-name/:namaKeluarga - Verify access code by family name
 * Body: { access_code }
 */
router.post("/verify-by-name/:namaKeluarga", async (req, res) => {
  try {
    const { access_code } = req.body;
    const namaKeluarga = decodeURIComponent(req.params.namaKeluarga);

    if (!access_code) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Kode akses harus diisi",
      });
    }

    const family = await Family.verifyAccessCodeByName(
      namaKeluarga,
      access_code
    );

    if (!family) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Kode akses salah atau keluarga tidak ditemukan",
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Kode akses valid",
      data: family,
    });
  } catch (error) {
    console.error("Error verifying access code by name:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Gagal memverifikasi kode akses",
      error: error.message,
    });
  }
});

module.exports = router;
