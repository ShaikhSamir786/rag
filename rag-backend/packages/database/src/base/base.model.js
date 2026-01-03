import { Model } from 'sequelize';

export class BaseModel extends Model {
    // Common properties like ID, tenantID are handled by Sequelize definitions
    // or extended model definitions.
    static initModel(sequelize) {
        // Base init logic if needed
    }
}
