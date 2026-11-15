pipeline {
  agent any

  environment {
    DOCKERHUB_USER = 'CHANGE_ME'
    IMAGE = "${DOCKERHUB_USER}/panier"
    TAG = "v${BUILD_NUMBER}"
  }

  triggers {
    pollSCM('H/2 * * * *')
  }

  stages {
    stage('Build') {
      steps {
        sh 'docker build -t $IMAGE:$TAG .'
      }
    }

    stage('Test') {
      steps {
        sh 'docker build --target test -t $IMAGE:test-$TAG .'
      }
    }

    stage('Push') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials',
                                          usernameVariable: 'DH_USER',
                                          passwordVariable: 'DH_PASS')]) {
          sh 'echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin'
          sh 'docker push $IMAGE:$TAG'
        }
      }
    }

    stage('Deploy') {
      steps {
        sh 'kubectl set image deployment/panier panier=$IMAGE:$TAG'
        sh 'kubectl rollout status deployment/panier --timeout=120s'
      }
    }
  }

  post {
    always {
      sh 'docker logout || true'
    }
  }
}
