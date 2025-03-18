import mongoose from "mongoose";
import dotenv from "dotenv";
import Artifact from "../models/Artifact.js";
import artifacts from "./artifacts.js";

dotenv.config();

const seedArtifacts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await Artifact.deleteMany({});
    await Artifact.insertMany(artifacts);

    console.log("Artifacts seeded successfully!");
    mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding artifacts:", error);
    mongoose.connection.close();
  }
};

seedArtifacts();