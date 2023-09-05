# Model ReadMe (Ignore)

This is background info for a currently unreleased feature. The following are general steps for image classification models used with another private repo.

## Preparing a model

- Currently using /code/FramesServer/ml_models/gg_classify_mobilenet_v3
  - cd /code/FramesServer/python
  - `python3 make_mobilenetv3_model.py` (check file and make sure that Make and Convert are set to true)
- (converter requires python env so load FrameServer's venv if need be)
- cd code/FramesServer/ml_models
- convert to graph model with the following:

  ```bash
  tensorflowjs_converter --input_format=tf_saved_model ./gg_classify_mobilenet_v3 ./tfjs_graph_model
  ```

- place output in public

  - ```bash
    cp -R tfjs_graph_model/ ../../FrameSlice/public/
    ```

- copy/use labels.json from gg_classify_mobilenet_v3 folder

  - ```bash
    cp gg_classify_mobilenet_v3/labels.json ../../FrameSlice/src/model_files/
    ```
