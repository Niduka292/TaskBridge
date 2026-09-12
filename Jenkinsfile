pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build User Service') {
            steps {
                dir('services/user-service') {
                    bat 'mvn clean package -DskipTests'
                }
            }
        }

        stage('Build Task Service') {
            steps {
                dir('services/task-service') {
                    bat 'mvn clean package -DskipTests'
                }
            }
        }

        stage('Build Payment Service') {
            steps {
                dir('services/payment-service') {
                    bat 'mvn clean package -DskipTests'
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                bat 'docker build -t taskbridge-user-service:latest ./services/user-service'
                bat 'docker build -t taskbridge-task-service:latest ./services/task-service'
                bat 'docker build -t taskbridge-payment-service:latest ./services/payment-service'
                bat 'docker build -t taskbridge-gateway:latest ./gateway'
            }
        }
    }

    post {
        success {
            echo 'TaskBridge CI pipeline completed successfully.'
        }

        failure {
            echo 'TaskBridge CI pipeline failed.'
        }
    }
}