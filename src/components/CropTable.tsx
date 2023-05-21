import { NextComponentType } from "next";
import { Crop } from "@/hooks/useFFmpeg";
import CropRow from "./CropRow";
import styles from "@/styles/CropTable.module.css";
import { useCallback } from "react";

type Props = {
  crops: Crop[];
  editCb?: (crops: Crop[]) => void;
};

const CropTable: NextComponentType<Record<string, never>, unknown, Props> = (
  props: Props
) => {
  const deleteCb = useCallback(
    (delCrop: Crop) => {
      const newCrops = props.crops.filter((crop) => crop.name !== delCrop.name);
      props.editCb?.(newCrops);
    },
    [props.editCb, JSON.stringify(props.crops)]
  );

  function handleEdit(crop: Crop, idx: number): void {
    const crops = props.crops;
    crops[idx] = crop;
    props.editCb?.([...crops]);
  }

  return (
    <table className={styles.CropTable}>
      {props.crops.length > 0 && (
        <>
          <thead>
            <tr>
              <th>Name</th>
              <th>X</th>
              <th>Y</th>
              <th>Width</th>
              <th>Height</th>
            </tr>
          </thead>
          <tbody>
            {props.crops?.map((crop, idx) => (
              <CropRow
                crop={crop}
                key={idx}
                deleteCb={deleteCb}
                editCb={(crop) => handleEdit(crop, idx)}
              />
            ))}
          </tbody>
        </>
      )}
    </table>
  );
};

export default CropTable;
