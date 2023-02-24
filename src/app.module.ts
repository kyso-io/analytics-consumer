import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from './database/database.module'
import { ReportsModule } from './reports/reports.module'

let envFilePath = '.env'
if (process.env.DOTENV_FILE) {
    envFilePath = process.env.DOTENV_FILE
}

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: envFilePath,
            isGlobal: true,
        }),
        DatabaseModule,
        ReportsModule,
    ],
})
export class AppModule {}
