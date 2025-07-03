import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    // Validate environment variable
    if (!process.env.DB) {
      throw new Error('MongoDB connection string not found in environment variables');
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.DB);
    console.log('✅ DB CONNECTED SUCCESSFULLY');
    
    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to DB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected from DB');
    });

  } catch (error) {
    // Improved error handling
    if (error instanceof Error) {
      console.error('❌ Database connection error:', error.message);
    } else {
      console.error('❌ An unknown error occurred while connecting to DB');
    }
    
    // Exit process with failure (recommended for production)
    process.exit(1);
  }
};

export default connectDB;