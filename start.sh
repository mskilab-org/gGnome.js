if [ ! -s public/genes.json ]; then
    echo 'Downloading genes.json (hg19)'
    wget -P public/ https://mskilab.s3.amazonaws.com/pgv/genes.json
fi
open http://localhost:8080/index.html
npm start
