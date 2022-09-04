import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import { NsfwSpyResult } from '../../nsfwspy-core';

tf.enableProdMode();

export class NsfwSpy {
    private imageSize: number;
    private modelPath: string;
    private model: tf.GraphModel | null;

    constructor(modelPath?: string) {
        this.imageSize = 224;
        this.modelPath = modelPath ?? "file://C:\\Users\\Jamie\\source\\repos\\NsfwSpy\\JavaScript\\mobilenet\\model.json";
        this.model = null;
    }

    async load() {
        this.model = await tf.loadGraphModel(this.modelPath);
    }

    async classifyImageFromByteArray(imageBuffer: Buffer) {
        const outputs = tf.tidy(() => {
            if (!this.model) throw new Error("The NsfwSpy model has not been loaded yet.");

            const decodedImage = tf.node.decodeImage(imageBuffer, 3)
                .toFloat()
                .div(tf.scalar(255)) as tf.Tensor3D;

            const resizedImage = tf.image.resizeBilinear(decodedImage, [224, 224], true);
            const image = resizedImage.reshape([1, this.imageSize, this.imageSize, 3]);

            return this.model.execute(
                { 'import/input': image },
                ['Score']
            ) as tf.Tensor2D;
        });

        var data = await outputs.data();
        outputs.dispose();
        
        return new NsfwSpyResult(data);
    }

    async classifyImageFile(filePath: string) {
        const imageBuffer = await fs.readFileSync(filePath);
        return this.classifyImageFromByteArray(imageBuffer);
    }
}