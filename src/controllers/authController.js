const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { HTTP_STATUS } = require("../config/constants");
const { generateToken } = require("../middleware/authMiddleware");

// Register user
exports.register = async (req, res) => {
  try {
    const { namaDepan, namaBelakang, email, password, gender } = req.body;

    // Validation
    if (!namaDepan || !namaBelakang || !email || !password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Semua field harus diisi",
      });
    }

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Email sudah terdaftar",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = {
      namaDepan,
      namaBelakang,
      email,
      password: hashedPassword,
      gender: gender || "Pria",
      role: "user", // Default role
    };

    const createdUser = await User.create(newUser);

    // Generate token
    const token = generateToken(createdUser);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Registrasi berhasil",
      data: {
        id: createdUser.id,
        email: createdUser.email,
        namaDepan: createdUser.namaDepan,
        role: createdUser.role,
      },
      token,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error registrasi",
      error: error.message,
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔐 Login attempt:", {
      email,
      passwordLength: password?.length,
    });

    if (!email || !password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Email dan password harus diisi",
      });
    }

    // Find user by email
    const user = await User.findByEmail(email);
    console.log(
      "👤 User found:",
      user ? { id: user.id, email: user.email } : "NOT FOUND"
    );

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Email atau password salah",
      });
    }

    // Check password
    console.log(
      "🔑 Checking password - Hash in DB:",
      user.password?.substring(0, 20) + "..."
    );
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("✓ Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Email atau password salah",
      });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      message: "Login berhasil",
      data: {
        id: user.id,
        email: user.email,
        namaDepan: user.namaDepan,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error login",
      error: error.message,
    });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        namaDepan: user.namaDepan,
        namaBelakang: user.namaBelakang,
        gender: user.gender,
        role: user.role,
        photoUrl: user.photoUrl,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error mengambil data user",
      error: error.message,
    });
  }
};
