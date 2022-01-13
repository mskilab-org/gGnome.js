if [ ! -s public/genes.json ]; then
    echo 'Downloading genes.json (hg19)'
    wget -O public/genes.json https://mskilab.s3.amazonaws.com/pgv/hg19.genes.json
fi
open http://localhost:8080/index.html
npm start
